import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["contact", "demo", "partner", "deal"],
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 180
    },
    company: {
      type: String,
      trim: true,
      maxlength: 160
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 40
    },
    role: {
      type: String,
      trim: true,
      maxlength: 120
    },
    interest: {
      type: String,
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      trim: true,
      maxlength: 1500
    },
    source: {
      type: String,
      default: "website",
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
