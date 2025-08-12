import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    profile: {
      type: mongoose.Types.ObjectId,
      ref: "Profile",
    },
    notifications: {
      email: {
        type: String,
        enum: ["all", "customized", "off"],
        default: "all",
      },
      push: {
        type: String,
        enum: ["all", "customized", "off"],
        default: "all",
      },
      customized: {
        email: [String],
        push: [String],
      },
    },
    language: {
      type: String,
      default: "en",
    },
    timezone: {
      type: String,
      default: "PDT",
    },
  },
  { versionKey: false },
);

export default mongoose.models.Setting || mongoose.model("Setting", schema);
