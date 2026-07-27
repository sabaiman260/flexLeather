import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    subtitle: { type: String },
    ctaText: { type: String },
    ctaUrl: { type: String },
    category: { type: String },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    imageKey: { type: String, required: true },
    imageAlt: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.Banner || mongoose.model('Banner', bannerSchema)
