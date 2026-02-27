import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: {
          type: String,
          enum: ["Admin", "Member", "Viewer"],
          default: "Member",
        },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ "members.userId": 1 });

export default mongoose.models.Workspace || mongoose.model("Workspace", workspaceSchema);
