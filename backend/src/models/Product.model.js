import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },

    sizes: [String],
    colors: [String],
    specs: [String],

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    images: [String],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");
  }
  next();
});

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
