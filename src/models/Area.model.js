import mongoose from "mongoose";

const AreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 240,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Helper: genera slug a partir del nombre
function toSlug(text) {
  return text
    .toString()
    .normalize("NFD") // quita acentos
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Antes de validar, asegura el slug coherente con el name
AreaSchema.pre("validate", function (next) {
  if (!this.slug && this.name) this.slug = toSlug(this.name);
  if (this.isModified("name")) this.slug = toSlug(this.name);
  next();
});

export default mongoose.model("Area", AreaSchema);