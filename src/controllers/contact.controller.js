import ContactInquiry from '../models/ContactInquiry.js';
import sendEmail from '../utils/sendEmail.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const submitInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const inquiry = await ContactInquiry.create({ name, email, phone: phone || '', subject: subject || 'General Inquiry', message });

    // Notify admin
    sendEmail({
      to: process.env.SMTP_USER,
      subject: `New Contact Inquiry: ${subject || 'General Inquiry'}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Inquiry from ${name}</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f5f5f5; padding: 16px; border-radius: 8px;">${message}</p>
        </div>
      `,
    });

    successResponse(res, inquiry, 'Inquiry submitted — we\'ll respond within 24 hours', 201);
  } catch (error) {
    next(error);
  }
};

export const getInquiries = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const inquiries = await ContactInquiry.find(filter).sort({ createdAt: -1 }).lean();
    successResponse(res, inquiries);
  } catch (error) {
    next(error);
  }
};

export const replyToInquiry = async (req, res, next) => {
  try {
    const inquiry = await ContactInquiry.findById(req.params.id);
    if (!inquiry) return errorResponse(res, 'Inquiry not found', 404);

    inquiry.adminReply = req.body.reply;
    inquiry.status = 'replied';
    inquiry.repliedAt = new Date();
    await inquiry.save();

    // Send reply email to customer
    sendEmail({
      to: inquiry.email,
      subject: `Re: ${inquiry.subject} — Mazhai Vaanam Boutique`,
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #FFFDF8;">
          <h1 style="color: #6B102A; font-size: 24px;">Mazhai Vaanam</h1>
          <p>Dear ${inquiry.name},</p>
          <p style="color: #555; line-height: 1.7;">${req.body.reply}</p>
          <hr style="border: none; border-top: 1px solid #F0E6D2; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">© Mazhai Vaanam Boutique</p>
        </div>
      `,
    });

    successResponse(res, inquiry, 'Reply sent');
  } catch (error) {
    next(error);
  }
};
