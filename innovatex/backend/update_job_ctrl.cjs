const fs = require('fs');

// 1. Update authController.ts
let authCode = fs.readFileSync('innovatex/backend/src/controllers/authController.ts', 'utf8');

authCode = authCode.replace(
  'resumeFileName,\n      removeResume,',
  'resumeFileName,\n      resumeBase64,\n      removeResume,'
).replace(
  'resumeFileName,\r\n      removeResume,',
  'resumeFileName,\r\n      resumeBase64,\r\n      removeResume,'
);

const resumeSaveBlock = `    if (resumeFileName) {
      user.resumeFileName = resumeFileName;
    }
    if (resumeBase64) {
      user.resumeBase64 = resumeBase64;
    }
    if (removeResume) {
      user.resumeFileName = '';
      user.resumeBase64 = '';
      user.resumeText = '';
    }`;

authCode = authCode.replace(
  /if \(resumeFileName\) \{\s*user\.resumeFileName = resumeFileName;\s*\}\s*if \(removeResume\) \{\s*user\.resumeFileName = '';\s*user\.resumeText = '';\s*\}/m,
  resumeSaveBlock
);

fs.writeFileSync('innovatex/backend/src/controllers/authController.ts', authCode, 'utf8');
console.log('authController.ts updated');

// 2. Update jobController.ts
let jobCode = fs.readFileSync('innovatex/backend/src/controllers/jobController.ts', 'utf8');

const targetJobCheck = `    if (!fileBuffer && req.body?.base64) {
      fileBuffer = Buffer.from(req.body.base64, 'base64');
      fileName = req.body.filename || 'resume.pdf';
      fileMime = req.body.mimetype || 'application/pdf';
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Please upload a PDF, DOCX, or TXT resume file.' });
    }`;

const replJobCheck = `    if (!fileBuffer && req.body?.base64) {
      fileBuffer = Buffer.from(req.body.base64, 'base64');
      fileName = req.body.filename || 'resume.pdf';
      fileMime = req.body.mimetype || 'application/pdf';
    }

    // Auto-fallback: check if user already has saved resumeBase64 or resumeText
    if (!fileBuffer && req.user?._id) {
      const User = (await import('../models/User.js')).default;
      const currentUser = await User.findById(req.user._id);
      if (currentUser?.resumeBase64) {
        fileBuffer = Buffer.from(currentUser.resumeBase64, 'base64');
        fileName = currentUser.resumeFileName || 'resume.pdf';
      } else if (currentUser?.resumeText && currentUser.resumeText.length > 20) {
        fileBuffer = Buffer.from(currentUser.resumeText, 'utf8');
        fileName = currentUser.resumeFileName || 'resume.txt';
        fileMime = 'text/plain';
      }
    }

    if (!fileBuffer) {
      return res.status(400).json({ error: 'Please upload a PDF, DOCX, or TXT resume file.' });
    }`;

if (jobCode.includes(targetJobCheck)) {
  jobCode = jobCode.replace(targetJobCheck, replJobCheck);
} else {
  const targetCrlf = targetJobCheck.replace(/\n/g, '\r\n');
  const replCrlf = replJobCheck.replace(/\n/g, '\r\n');
  jobCode = jobCode.replace(targetCrlf, replCrlf);
}

// Also in jobController, when fileBuffer exists and req.body.base64 or fileBuffer is uploaded, cache it to user.resumeBase64
const profileSyncTarget = `        if (fileName) {
          user.resumeFileName = fileName;
          changed = true;
        }`;

const profileSyncRepl = `        if (fileName) {
          user.resumeFileName = fileName;
          if (fileBuffer && fileBuffer.length < 5 * 1024 * 1024) {
            user.resumeBase64 = fileBuffer.toString('base64');
          }
          changed = true;
        }`;

if (jobCode.includes(profileSyncTarget)) {
  jobCode = jobCode.replace(profileSyncTarget, profileSyncRepl);
} else {
  const profileSyncTargetCrlf = profileSyncTarget.replace(/\n/g, '\r\n');
  const profileSyncReplCrlf = profileSyncRepl.replace(/\n/g, '\r\n');
  jobCode = jobCode.replace(profileSyncTargetCrlf, profileSyncReplCrlf);
}

fs.writeFileSync('innovatex/backend/src/controllers/jobController.ts', jobCode, 'utf8');
console.log('jobController.ts updated');

