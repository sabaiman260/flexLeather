import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true
    },
    description: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Compound index on parentCategory and name to quickly search or check under same parent
categorySchema.index({ parentCategory: 1, name: 1 });

categorySchema.pre("validate", async function (next) {
  if (this.isModified("name") || this.isModified("parentCategory") || !this.slug) {
    const rawName = this.name || "";
    let baseSlug = rawName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");

    if (this.parentCategory) {
      try {
        const parent = await mongoose.model("Category").findById(this.parentCategory);
        if (parent && (parent.slug || parent.name)) {
          const parentSlug = (parent.slug || parent.name).trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
          // Avoid double prefixing if already prefixed
          if (!baseSlug.startsWith(`${parentSlug}-`)) {
            baseSlug = `${parentSlug}-${baseSlug}`;
          }
        }
      } catch (err) {
        console.error("Error generating parent-prefixed category slug:", err);
      }
    }

    this.slug = baseSlug;
  }
  next();
});

const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

// Automatically drop any obsolete MongoDB indexes on startup
const cleanupCategoryIndexes = async () => {
  try {
    const indexes = await Category.collection.indexes();
    for (const idx of indexes) {
      // Drop any unique index on "name"
      if (idx.key && idx.key.name === 1 && idx.unique && idx.name) {
        console.log(`[Category.model] Dropping obsolete unique index on name: ${idx.name}`);
        await Category.collection.dropIndex(idx.name);
      }
    }
  } catch (e) {
    // Collection or index might not exist yet; safe to ignore
  }
};

Category.on("index", () => {
  cleanupCategoryIndexes().catch(() => {});
});

// Also attempt immediate cleanup if collection is available
if (mongoose.connection.readyState === 1) {
  cleanupCategoryIndexes().catch(() => {});
} else {
  mongoose.connection.once("connected", () => {
    cleanupCategoryIndexes().catch(() => {});
  });
}

export default Category;
