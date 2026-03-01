import mongoose from "mongoose";

const VocabularySchema = new mongoose.Schema(
  {
    originalWord: {
      type: String,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    pronunciation: {
      type: String,
      trim: true,
    },
    meaning: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Vocabulary =
  mongoose.models.Vocabulary || mongoose.model("Vocabulary", VocabularySchema);

export default Vocabulary;
