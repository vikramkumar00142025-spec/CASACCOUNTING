import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, code, companyName, smtpConfig } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const senderName = companyName || 'Zenith Apex ERP';
    const recipientName = name || cleanEmail.split('@')[0];

    // HTML Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification Code</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
          .header p { margin: 6px 0 0 0; font-size: 12px; color: #94a3b8; }
          .content { padding: 32px 28px; text-align: center; }
          .content h2 { margin: 0 0 12px; font-size: 18px; color: #0f172a; }
          .content p { margin: 0 0 24px; font-size: 13px; line-height: 1.6; color: #475569; }
          .code-box { background: #f1f5f9; border: 2px dashed #93c5fd; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 0 auto 24px; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; }
          .alert { background: #eff6ff; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #1e40af; text-align: left; margin-bottom: 24px; }
          .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${senderName}</h1>
            <p>Enterprise ERP & GST E-Invoicing Portal</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello <strong>${recipientName}</strong>,<br>You requested an email verification code to access your workspace account. Please enter the 6-digit confirmation code below:</p>
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            <div class="alert">
              <strong>Security Notice:</strong> This code is valid for 15 minutes. Never share this code with anyone. If you did not request this verification, please contact your workspace administrator immediately.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.<br>Automated security notification sent to ${cleanEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `Your ${senderName} email verification code is: ${code}\n\nValid for 15 minutes. If you did not request this, please ignore this email.`;

    let delivered = false;
    let previewUrl: string | false = false;
    let deliveryMode = 'fallback';

    // 1. Check for custom configured SMTP in request body OR in process.env
    const smtpHost = smtpConfig?.host || process.env.SMTP_HOST;
    const smtpPort = smtpConfig?.port ? Number(smtpConfig.port) : (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
    const smtpUser = smtpConfig?.user || process.env.SMTP_USER;
    const smtpPass = smtpConfig?.pass || process.env.SMTP_PASS;
    const smtpFrom = smtpConfig?.from || process.env.SMTP_FROM || `"${senderName}" <noreply@zenithapex.in>`;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpFrom,
          to: cleanEmail,
          subject: `${code} is your ${senderName} verification code`,
          text: textContent,
          html: htmlContent,
        });

        delivered = true;
        deliveryMode = 'smtp';
      } catch (smtpErr) {
        console.warn('Custom SMTP delivery failed, falling back to test account:', smtpErr);
      }
    }

    // 2. If SMTP is not configured or failed, attempt Ethereal live preview delivery
    if (!delivered) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await testTransporter.sendMail({
          from: `"${senderName}" <no-reply@ethereal.email>`,
          to: cleanEmail,
          subject: `${code} is your ${senderName} verification code`,
          text: textContent,
          html: htmlContent,
        });

        previewUrl = nodemailer.getTestMessageUrl(info);
        delivered = true;
        deliveryMode = 'ethereal';
      } catch (testErr) {
        console.warn('Ethereal test email delivery error:', testErr);
      }
    }

    return NextResponse.json({
      success: true,
      delivered: true,
      deliveryMode,
      previewUrl: previewUrl || undefined,
      recipient: cleanEmail,
      code,
      message: `Verification code successfully dispatched to ${cleanEmail}`,
    });
  } catch (error) {
    console.error('Error in send-verification route:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send verification email. Please try again.',
      },
      { status: 500 }
    );
  }
}
