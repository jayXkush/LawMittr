import nodemailer from 'nodemailer';
import { env, isEmailConfigured } from '../config/env';

interface AppointmentEmailDetails {
  clientName: string;
  clientEmail: string;
  lawyerName: string;
  lawyerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  amount: number;
  paymentMode: 'real' | 'demo';
  meetingId: string;
  meetingPassword: string;
  notes?: string;
}

function getTransporter() {
  if (!isEmailConfigured) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

function paymentLabel(mode: 'real' | 'demo'): string {
  return mode === 'demo' ? 'Demo payment (no charge)' : 'Paid via Razorpay';
}

function buildHtml(details: AppointmentEmailDetails, recipient: 'client' | 'lawyer'): string {
  const greeting = recipient === 'client' ? details.clientName : details.lawyerName;
  const roleNote =
    recipient === 'client'
      ? `Your consultation with <strong>${details.lawyerName}</strong> is confirmed.`
      : `A new consultation with <strong>${details.clientName}</strong> is confirmed.`;

  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #1e3a5f;">LawMittr — Appointment Confirmed</h2>
      <p>Hello ${greeting},</p>
      <p>${roleNote}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; color: #64748b;">Date</td><td><strong>${details.date}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Time</td><td><strong>${details.startTime} – ${details.endTime}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Fee</td><td><strong>₹${details.amount}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Payment</td><td><strong>${paymentLabel(details.paymentMode)}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Meeting ID</td><td><strong>${details.meetingId}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">Meeting password</td><td><strong>${details.meetingPassword}</strong></td></tr>
      </table>
      ${details.notes ? `<p><em>Client notes:</em> ${details.notes}</p>` : ''}
      <p style="color: #64748b; font-size: 14px;">Video consultation will be available in a future update. Save these meeting credentials for your records.</p>
      <p>— LawMittr</p>
    </div>
  `;
}

export async function sendAppointmentConfirmationEmails(
  details: AppointmentEmailDetails
): Promise<void> {
  const transporter = getTransporter();
  if (!transporter || !env.EMAIL_FROM) {
    console.info(
      '[email] SMTP not configured — skipping confirmation emails for meeting',
      details.meetingId
    );
    return;
  }

  const subject = `LawMittr: Consultation confirmed on ${details.date}`;
  const paymentNote = paymentLabel(details.paymentMode);

  await Promise.all([
    transporter.sendMail({
      from: env.EMAIL_FROM,
      to: details.clientEmail,
      subject,
      text: `Your appointment is confirmed. Payment: ${paymentNote}. Meeting ID: ${details.meetingId}, Password: ${details.meetingPassword}`,
      html: buildHtml(details, 'client'),
    }),
    transporter.sendMail({
      from: env.EMAIL_FROM,
      to: details.lawyerEmail,
      subject: `LawMittr: New client booking on ${details.date}`,
      text: `New confirmed appointment. Payment: ${paymentNote}. Meeting ID: ${details.meetingId}, Password: ${details.meetingPassword}`,
      html: buildHtml(details, 'lawyer'),
    }),
  ]);
}
