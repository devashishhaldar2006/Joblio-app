import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  resendClient = new Resend(apiKey.trim());
  return resendClient;
}

export interface WelcomeEmailParams {
  toEmail: string;
  userName: string;
  targetRole?: string;
  authProvider?: string;
}

/**
 * Sends a modern, developer-themed HTML welcome email to new users.
 * Gracefully silent if RESEND_API_KEY is not configured or in case of transient delivery errors.
 */
export async function sendWelcomeEmail({
  toEmail,
  userName,
  targetRole = 'Software Engineer',
  authProvider = 'email',
}: WelcomeEmailParams): Promise<{ success: boolean; id?: string }> {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('[EmailService] RESEND_API_KEY is not configured. Skipping welcome email.');
      return { success: false };
    }

    // Skip placeholder or invalid synthetic clerk emails
    if (!toEmail || toEmail.endsWith('@clerk.user') || !toEmail.includes('@')) {
      console.log('[EmailService] Invalid or synthetic recipient email:', toEmail);
      return { success: false };
    }

    const firstName = userName ? userName.split(' ')[0] : 'Developer';
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Joblio <onboarding@joblio.hackcentral.me>';

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Joblio</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0A0A0A;
      color: #EDEDED;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #0A0A0A;
      padding: 40px 10px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #141414;
      border: 1px solid #262626;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .header {
      padding: 32px 32px 24px 32px;
      background: linear-gradient(180deg, rgba(255, 122, 0, 0.12) 0%, rgba(20, 20, 20, 0) 100%);
      border-bottom: 1px solid #262626;
    }
    .logo-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1F1F1F;
      border: 1px solid #333333;
      padding: 6px 14px;
      border-radius: 20px;
      color: #FF7A00;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .hero-title {
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 700;
      margin-top: 20px;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .hero-sub {
      color: #888888;
      font-size: 14px;
      margin: 0;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      color: #EDEDED;
      margin-bottom: 16px;
    }
    .feature-card {
      background-color: #1A1A1A;
      border: 1px solid #262626;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 14px;
    }
    .feature-title {
      color: #FF7A00;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .feature-desc {
      color: #AAAAAA;
      font-size: 13px;
      margin: 0;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .cta-btn {
      display: inline-block;
      background-color: #FF7A00;
      color: #000000;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      letter-spacing: -0.2px;
    }
    .footer {
      padding: 24px 32px;
      background-color: #0F0F0F;
      border-top: 1px solid #222222;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .footer a {
      color: #FF7A00;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-badge">⚡ JOBLIO PLATFORM</div>
        <h1 class="hero-title">Welcome to the future of developer careers, ${firstName}!</h1>
        <p class="hero-sub">Your developer intelligence workspace is officially live.</p>
      </div>

      <div class="content">
        <p class="greeting">Hey ${firstName},</p>
        <p style="color: #BBBBBB; font-size: 14px; margin-bottom: 24px;">
          Thanks for joining <strong>Joblio</strong>. We built this platform to replace outdated keyword-based job boards with direct engineering telemetry, AI skill matching, and real-time market insights.
        </p>

        <div class="feature-card">
          <div class="feature-title">🎯 AI Resume & Competency Matching</div>
          <p class="feature-desc">Upload your resume once. Our NLP engine extracts technical proficiencies and maps you directly against verified engineering listings across LinkedIn, Y Combinator, and Internshala.</p>
        </div>

        <div class="feature-card">
          <div class="feature-title">🔍 GitHub Profile & Code Quality Audit</div>
          <p class="feature-desc">Get automated repository hygiene checks, CI/CD pipeline suggestions, and actionable PR guidance to stand out to engineering hiring managers.</p>
        </div>

        <div class="feature-card">
          <div class="feature-title">📈 Time-Series Market Forecasting</div>
          <p class="feature-desc">Track real-time hiring demand trajectories (+4W, +12W, +26W) powered by Prophet & ARIMA models to prioritize the most lucrative skills.</p>
        </div>

        <div class="feature-card">
          <div class="feature-title">🏆 Competitive Programming Hub</div>
          <p class="feature-desc">Unified calendar tracking upcoming contests across LeetCode, Codeforces, AtCoder, and CodeChef so you never miss a match.</p>
        </div>

        <div class="cta-container">
          <a href="https://joblio.hackcentral.me" class="cta-btn">Open Joblio Dashboard →</a>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px 0;">Joblio Platform · Engineered by Devashish & Om</p>
        <p style="margin: 0;">Need support or have feedback? Reply directly to this email or visit <a href="https://joblio.hackcentral.me">joblio.hackcentral.me</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject: `Welcome to Joblio, ${firstName}! 🚀`,
      html: htmlContent,
    });

    if (error) {
      console.warn('[EmailService] Resend delivery error:', error);
      return { success: false };
    }

    console.log(`[EmailService] Welcome email successfully sent to ${toEmail} (ID: ${data?.id})`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.warn('[EmailService] Unexpected error sending welcome email:', err.message);
    return { success: false };
  }
}

