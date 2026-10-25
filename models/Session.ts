import mongoose, { InferSchemaType, Model } from "mongoose";

// Only a SHA-256 of the cookie token is stored, so a DB leak can't be replayed as a login.
const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // TTL index: Mongo deletes the document once this time has passed.
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export type SessionDoc = InferSchemaType<typeof sessionSchema>;

// Dev hot reload keeps the old compiled model around; drop it so schema edits apply.
if (process.env.NODE_ENV !== "production") delete mongoose.models.Session;

export const Session: Model<SessionDoc> =
  (mongoose.models.Session as Model<SessionDoc>) ??
  mongoose.model<SessionDoc>("Session", sessionSchema);
