import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, replyTo, fromName } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, error: 'to, subject, and html are required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPass = process.env.GMAIL_APP_PASSWORD;

    // Try Resend with verified domain first, fallback to onboarding@resend.dev
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const domainFrom = fromName ? `${fromName} <outreach@ariaagent.agency>` : 'ariaagent solutions <outreach@ariaagent.agency>';
      const fallbackFrom = fromName ? `${fromName} <onboarding@resend.dev>` : 'ariaagent solutions <onboarding@resend.dev>';

      // Try verified domain first
      let result = await resend.emails.send({
        from: domainFrom,
        to: [to],
        subject,
        html,
        replyTo: replyTo || 'aria.agentworks@gmail.com',
      });

      // If domain not verified, fallback to onboarding@resend.dev
      if (result.error && result.error.message?.includes('not verified')) {
        result = await resend.emails.send({
          from: fallbackFrom,
          to: [to],
          subject,
          html,
          replyTo: replyTo || 'aria.agentworks@gmail.com',
        });
      }

      if (result.error) {
        return NextResponse.json({ success: false, error: result.error.message, provider: 'resend' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        messageId: result.data?.id,
        provider: 'resend',
      });
    }

    // Fallback: Gmail SMTP via nodemailer
    if (gmailUser && gmailAppPass) {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailAppPass },
      });

      const info = await transporter.sendMail({
        from: gmailUser,
        to,
        subject,
        html,
        replyTo: replyTo || gmailUser,
      });

      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        provider: 'gmail',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No email provider configured.',
    }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
