"""Model client abstraction to support multiple LLM providers (Gemini, Groq)."""
from typing import Optional

from config import settings

# Gemini (Google) client
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
except Exception:
    ChatGoogleGenerativeAI = None

# Groq client
try:
    from groq import Groq
except Exception:
    Groq = None


class BaseModelClient:
    def invoke(self, prompt: str) -> str:
        raise NotImplementedError()


class GeminiClient(BaseModelClient):
    def __init__(self):
        if ChatGoogleGenerativeAI is None:
            raise RuntimeError("Gemini client unavailable (langchain_google_genai not installed)")
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")
        self.model = ChatGoogleGenerativeAI(
            model=settings.GEMINI_CHAT_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.2,
        )

    def invoke(self, prompt: str) -> str:
        resp = self.model.invoke(prompt)
        # langchain_google_genai responses expose .content in many versions
        if hasattr(resp, "content"):
            return resp.content
        try:
            return str(resp)
        except Exception:
            return str(resp)


class GroqClient(BaseModelClient):
    """Groq API client using the official groq SDK."""

    def __init__(self):
        if Groq is None:
            raise RuntimeError("Groq SDK not installed. Install with: pip install groq")
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not configured in .env")
        
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        # Use a fast Groq model
        self.model = settings.GROQ_MODEL

    def invoke(self, prompt: str) -> str:
        """Call Groq API with the prompt and return response text."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a legal document analysis assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2048,
                top_p=1,
            )
            # Extract text from the response
            if response.choices and len(response.choices) > 0:
                content = response.choices[0].message.content
                return content if content else ""
            return ""
        except Exception as e:
            raise RuntimeError(f"Groq API error: {str(e)}")


def get_model_client() -> BaseModelClient:
    """Factory function to return the configured model client."""
    provider = (settings.MODEL_PROVIDER or "gemini").lower()
    # Accept both 'groq' and 'grok' as aliases for Groq
    if provider in ("grok", "groq"):
        return GroqClient()
    # default to gemini
    return GeminiClient()
