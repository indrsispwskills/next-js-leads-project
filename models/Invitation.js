import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["Admin", "Member", "Viewer"], default: "Member" },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["Pending", "Accepted"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema);
