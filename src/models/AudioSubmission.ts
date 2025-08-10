import mongoose, { Schema } from "mongoose";

const AudioSubmissionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  // If the file is stored externally, provide a URL
  audioUrl: { type: String, required: false },
  // If the file is stored directly in Mongo (small files <= ~15MB), keep the binary here
  audioData: { type: Buffer, required: false },
  mimeType: { type: String },
  coverImage: { type: String },
  creatorAddress: { type: String, index: true },
  durationSeconds: { type: Number },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default (mongoose.models.AudioSubmission as mongoose.Model<any>) ||
  mongoose.model('AudioSubmission', AudioSubmissionSchema);