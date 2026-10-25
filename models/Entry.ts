import mongoose, { InferSchemaType, Model } from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rawText: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["expense", "income"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    category: { type: String, required: true },
    merchant: { type: String, default: null },
    occurredAt: { type: Date, required: true },
    confidence: { type: Number, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

export type EntryDoc = InferSchemaType<typeof entrySchema>;

// Dev hot reload keeps the old compiled model around; drop it so schema edits apply.
if (process.env.NODE_ENV !== "production") delete mongoose.models.Entry;

export const Entry: Model<EntryDoc> =
  (mongoose.models.Entry as Model<EntryDoc>) ??
  mongoose.model<EntryDoc>("Entry", entrySchema);
