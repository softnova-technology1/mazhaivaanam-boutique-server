import mongoose from 'mongoose';

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      default: 'GENERAL INQUIRY',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
    },
    adminReply: {
      type: String,
      default: '',
    },
    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ContactInquiry = mongoose.model('ContactInquiry', contactInquirySchema);
export default ContactInquiry;
