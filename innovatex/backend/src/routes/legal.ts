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


router.get('/delete-account', (req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account & Data Deletion - Joblio</title>
  <style>
    :root {
      --bg: #0A0A0A;
      --card-bg: #141414;
      --border: #262626;
      --text: #EDEDED;
      --text-muted: #888888;
      --primary: #FF7A00;
      --primary-light: #FFA34D;
      --danger: #EF4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
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
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .badge {
      display: inline-block;
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h1 { font-size: 28px; font-weight: 700; color: #FFFFFF; margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 15px; margin-bottom: 28px; }
    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #FFFFFF;
      margin-top: 28px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
    }
    p, li { color: #CCCCCC; font-size: 15px; margin-bottom: 12px; }
    ul, ol { margin-left: 20px; margin-bottom: 16px; }
    li { margin-bottom: 6px; }
    .steps-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .contact-card {
      background: rgba(255, 122, 0, 0.05);
      border: 1px solid rgba(255, 122, 0, 0.2);
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
    }
    a { color: var(--primary-light); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .btn {
      display: inline-block;
      background: var(--primary);
      color: #000;
      font-weight: 600;
      padding: 10px 18px;
      border-radius: 6px;
      margin-top: 10px;
      text-decoration: none;
    }
    .btn:hover { background: var(--primary-light); text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">
      <span class="badge">Google Play Data Safety</span>
    </div>
    <h1>Joblio Account & Data Deletion Request</h1>
    <div class="subtitle">Compliant with Google Play Store User Data & Deletion Policy</div>

    <p>At <strong>Joblio</strong>, you have complete sovereignty over your personal data. In compliance with Google Play Store policies and international data protection laws (GDPR, CCPA), you can delete your account and all associated personal data at any time.</p>

    <h2>Option 1: In-App Immediate Deletion (Instant)</h2>
    <div class="steps-card">
      <ol>
        <li>Open the <strong>Joblio</strong> app on your Android device.</li>
        <li>Navigate to the <strong>Profile</strong> tab (bottom right icon).</li>
        <li>Scroll down to the <strong>Account Settings</strong> section.</li>
        <li>Tap <strong>Delete Account & Data</strong> and confirm.</li>
      </ol>
      <p style="margin-top: 12px; color: #888888; font-size: 13px;">This instantly wipes your profile, uploaded resumes, saved job bookmarks, and developer history from our servers.</p>
    </div>

    <h2>Option 2: Web Deletion Request (Without App Access)</h2>
    <p>If you have uninstalled the app or cannot log in, you can request account deletion directly by contacting our compliance officers:</p>
    <div class="contact-card">
      <p>Send an email with the subject <strong>"Joblio Data Deletion Request"</strong> from the email address registered with your account to:</p>
      <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> <a href="mailto:workfordevashishhaldar@gmail.com?subject=Joblio%20Data%20Deletion%20Request">workfordevashishhaldar@gmail.com</a></p>
      <p>Include your registered email address or public username. Our team will verify and execute the permanent purge within <strong>24–48 hours</strong> and send confirmation.</p>
      <a class="btn" href="mailto:workfordevashishhaldar@gmail.com?subject=Joblio%20Data%20Deletion%20Request">Send Deletion Request Email</a>
    </div>

    <h2>What Data Is Deleted Permanently?</h2>
    <ul>
      <li><strong>User Profile:</strong> Name, registered email address, avatar, bio, and target engineering roles.</li>
      <li><strong>Resumes & Uploaded Files:</strong> Stored resume documents, parsed technical skills, and extracted text.</li>
      <li><strong>Activity History:</strong> Job search match logs, bookmarked jobs, and GitHub repository hygiene audits.</li>
      <li><strong>Authentication Tokens:</strong> Identity provider bindings and active session tokens.</li>
    </ul>

    <h2>Data Retention Period</h2>
    <p>Once requested or triggered in-app, all personally identifiable data is permanently purged immediately and cannot be recovered. Aggregated, fully anonymized statistics (such as overall technology demand percentages) do not link back to any individual user.</p>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

export default router;

