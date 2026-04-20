import mongoose from 'mongoose';

const contactRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'read', 'replied', 'closed'], default: 'new' },
    adminNote: { type: String, default: '' },
  },
  { timestamps: true }
);

contactRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.ContactRequest || mongoose.model('ContactRequest', contactRequestSchema);
