import { Router, Request, Response } from 'express';

const router = Router();

router.get('/privacy', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Joblio</title>
  <style>
    :root {
      --bg: #0A0A0A;
      --card-bg: #141414;
      --border: #262626;
      --text: #EDEDED;
      --text-muted: #888888;
      --primary: #FF7A00;
      --primary-light: #FFA34D;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 40px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 122, 0, 0.15);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    .last-updated {
      color: var(--text-muted);
      font-size: 14px;
      margin-bottom: 32px;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #FFFFFF;
      margin-top: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }
    p, li {
      color: #CCCCCC;
      font-size: 15px;
      margin-bottom: 12px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 16px;
    }
    li {
      margin-bottom: 6px;
    }
    .contact-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
    }
    a {
      color: var(--primary-light);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <span class="badge">Legal Document</span>
    </div>
    <h1>Privacy Policy for Joblio</h1>
    <div class="last-updated">Last Updated: October 27, 2026</div>

    <p>Welcome to <strong>Joblio</strong> ("we", "our", or "us"). We provide an AI-powered Developer Intelligence & Job Matching Platform accessible via mobile applications and associated web services. Your privacy is paramount to us, and this Privacy Policy outlines how we collect, use, process, and safeguard your data when using Joblio.</p>

    <h2>1. Information We Collect</h2>
    <p>To provide personalized job matching, competitive programming tracking, and developer analytics, we may collect the following data:</p>
    <ul>
      <li><strong>Account Details:</strong> When you register via email, Google OAuth, or GitHub OAuth through our authentication partner (Clerk), we receive your primary name, email address, and avatar.</li>
      <li><strong>Professional & Career Data:</strong> Your target engineering role, self-declared programming skills, preferred locations, and work preferences.</li>
      <li><strong>Resume / Document Uploads:</strong> When you upload a resume (PDF, DOCX, TXT), our system extracts technical competencies, work history, and experience levels solely to match you with job and internship listings.</li>
      <li><strong>Public Developer Handles:</strong> If you connect or provide your public GitHub username, we retrieve publicly accessible repository stats, languages, and commit frequency to generate your developer intelligence score.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <p>We use your information exclusively for the following purposes:</p>
    <ul>
      <li>To compute semantic relevance scores between your skills and active engineering job/internship openings.</li>
      <li>To generate automated GitHub repository hygiene audits and CI/CD workflow recommendations.</li>
      <li>To personalize competitive programming contest schedules (LeetCode, Codeforces, AtCoder, CodeChef).</li>
      <li>To forecast tech stack hiring trends based on aggregated, non-personally identifiable market demand.</li>
    </ul>

    <h2>3. Data Sharing & Third-Party Processors</h2>
    <p><strong>We do not sell, rent, or trade your personal data.</strong> We transmit data only to vetted infrastructure service providers required to operate Joblio:</p>
    <ul>
      <li><strong>Authentication:</strong> Clerk (secure OAuth and session handling).</li>
      <li><strong>Database & Cloud Hosting:</strong> MongoDB Atlas (encrypted database storage) and Render (HTTPS application hosting).</li>
      <li><strong>AI Acceleration & Caching:</strong> Upstash Redis (serverless in-memory query caching) and LLM inference providers (Groq / Google Gemini) for document parsing. Text sent for inference is transient and not retained to train third-party foundation models.</li>
    </ul>

    <h2>4. Data Retention & Security</h2>
    <p>All data transmitted between your mobile client and our servers is encrypted in transit using industry-standard <strong>HTTPS/TLS encryption</strong>. Passwords (if created) are never stored in plaintext. Resumes remain attached to your profile until you choose to replace or delete them.</p>

    <h2>5. User Rights & Data Deletion</h2>
    <p>Under global privacy regulations (including GDPR and CCPA), you retain full rights over your data. You may at any time:</p>
    <ul>
      <li>View and update your stored developer profile, skills, and target role directly within the app.</li>
      <li>Replace or remove your uploaded resume file.</li>
      <li>Request permanent deletion of your account and all associated analytical records by contacting us.</li>
    </ul>

    <h2>6. Children's Privacy</h2>
    <p>Joblio is intended for developers, engineering students, and career professionals seeking software employment. We do not knowingly collect personal information from children under the age of 13.</p>

    <h2>7. Contact & Authors</h2>
    <div class="contact-card">
      <p>If you have any questions, concerns, or data deletion requests regarding this Privacy Policy, please reach out to our team at:</p>
      <p><strong>Email:</strong> <a href="mailto:workfordevashishhaldar@gmail.com">workfordevashishhaldar@gmail.com</a></p>
      <p><strong>Created by:</strong> Devashish & Om</p>
      <p><strong>GitHub:</strong> <a href="https://github.com/devashishhaldar2006">Devashish</a> · <a href="https://github.com/loqom">Om</a></p>
      <p><strong>LinkedIn:</strong> <a href="https://linkedin.com/in/devashish-haldar-dev">Devashish</a> · <a href="https://linkedin.com/in/om-vishwakarma-codes">Om</a></p>
    </div>
  </div>
</body>
</html>
`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;

