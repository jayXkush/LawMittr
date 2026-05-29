"""Legal document analyzer — runs analysis chains via Gemini."""

import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

from config import settings
from services.model_client import get_model_client
from prompts.legal_prompts import ANALYSIS_PROMPTS
from models.schemas import DocumentAnalysis, RiskyClause, Obligation


_executor = ThreadPoolExecutor(max_workers=4)


def _run_chain(prompt_template: str, context: str) -> str:
    """Run a single analysis chain synchronously using the configured provider."""
    client = get_model_client()
    prompt = prompt_template.format(context=context)
    response = client.invoke(prompt)
    return response if isinstance(response, str) else str(response)


def _parse_json_response(text: str) -> list[dict]:
    """Parse JSON from LLM response, handling common formatting issues."""
    # Strip markdown code fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last lines (fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        return []
    except json.JSONDecodeError:
        # Try to find JSON array in the text
        start = cleaned.find("[")
        end = cleaned.rfind("]")
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                return []
        return []


async def analyze_document(full_text: str, chunk_ids: list[str] | None = None) -> DocumentAnalysis:
    """
    Run all 4 analysis chains concurrently and return structured results.

    Uses a thread pool to run synchronous LangChain calls in parallel.
    """
    # Use first ~15k chars of text for analysis context (Gemini can handle more,
    # but this keeps costs and latency reasonable)
    context = full_text[:15000]

    loop = asyncio.get_event_loop()

    # Run all four chains in parallel
    summary_future = loop.run_in_executor(
        _executor,
        _run_chain,
        ANALYSIS_PROMPTS["summary"],
        context,
    )
    risks_future = loop.run_in_executor(
        _executor,
        _run_chain,
        ANALYSIS_PROMPTS["risky_clauses"],
        context,
    )
    obligations_future = loop.run_in_executor(
        _executor,
        _run_chain,
        ANALYSIS_PROMPTS["obligations"],
        context,
    )
    simple_future = loop.run_in_executor(
        _executor,
        _run_chain,
        ANALYSIS_PROMPTS["simple_explanation"],
        context,
    )

    summary_text, risks_text, obligations_text, simple_text = await asyncio.gather(
        summary_future, risks_future, obligations_future, simple_future
    )

    # Parse structured outputs
    risks_raw = _parse_json_response(risks_text)
    obligations_raw = _parse_json_response(obligations_text)

    risky_clauses = [
        RiskyClause(
            clause=r.get("clause", ""),
            risk_level=r.get("risk_level", "medium"),
            explanation=r.get("explanation", ""),
            page=r.get("page"),
            source_chunk_ids=r.get("source_chunk_ids", []),
        )
        for r in risks_raw
        if r.get("clause")
    ]

    obligations = [
        Obligation(
            party=o.get("party", "Unknown"),
            obligation=o.get("obligation", ""),
            source_text=o.get("source_text", ""),
            page=o.get("page"),
        )
        for o in obligations_raw
        if o.get("obligation")
    ]

    return DocumentAnalysis(
        summary=summary_text.strip(),
        risky_clauses=risky_clauses,
        obligations=obligations,
        simple_explanation=simple_text.strip(),
    )
