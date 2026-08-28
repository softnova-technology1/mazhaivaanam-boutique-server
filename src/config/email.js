import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup (non-blocking)
if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_email@gmail.com' || !process.env.SMTP_PASS || process.env.SMTP_PASS === 'your_email_app_password') {
  console.log('ℹ️  Email transport disabled (using placeholder credentials in .env)');
} else {
  transporter.verify()
    .then(() => console.log('✅ Email transport ready'))
    .catch((err) => console.warn('⚠️  Email transport not configured:', err.message));
}

export default transporter;
