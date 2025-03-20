import mongoose, { Schema, Document } from 'mongoose';

// AI Synopsis interface
export interface ScriptSynopsis {
  logline: string;
  synopsis: string;
  tone: string;
  themes: string[];
  title_suggestion?: string;
  target_audience?: string[];
  generated_at?: Date;
}

export interface IScript extends Document {
  id: string;
  writer_id: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  script_hash?: string;
  status: 'draft' | 'submitted' | 'sold' | 'rejected';
  ai_synopsis?: ScriptSynopsis;
  last_synopsis_at?: Date;
}

const ScriptSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  writer_id: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  script_hash: { type: String },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'sold', 'rejected'], 
    default: 'draft' 
  },
  ai_synopsis: {
    logline: { type: String },
    synopsis: { type: String },
    tone: { type: String },
    themes: [{ type: String }],
    title_suggestion: { type: String },
    target_audience: [{ type: String }],
    generated_at: { type: Date, default: Date.now }
  },
  last_synopsis_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.models.Script || mongoose.model<IScript>('Script', ScriptSchema); 