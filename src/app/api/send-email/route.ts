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

    // Try Resend first
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const fromEmail = fromName ? `${fromName} <outreach@ariaagent.agency>` : 'ariaagent solutions <outreach@ariaagent.agency>';

      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: [to],
        subject,
        html,
        replyTo: replyTo || undefined,
      });

      if (error) {
        return NextResponse.json({ success: false, error: error.message, provider: 'resend' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        messageId: data?.id,
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
      error: 'No email provider configured. Add RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD to .env.local',
      setupGuide: {
        resend: '1. Sign up at resend.com (free, 3000 emails/mo)  2. Create API key  3. Add RESEND_API_KEY=re_xxx to .env.local',
        gmail: '1. Google "Gmail App Password"  2. Create one  3. Add GMAIL_USER=you@gmail.com + GMAIL_APP_PASSWORD=xxxx to .env.local',
      },
    }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
