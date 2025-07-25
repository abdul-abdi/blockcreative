import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  address: string;
  role: 'writer' | 'producer' | 'admin';
  created_at: Date;
  updated_at: Date;
  profile_data: {
    name?: string;
    email?: string;
    image?: string;
    bio?: string;
    avatar?: string;
    website?: string;
    company_name?: string;
    social?: {
      twitter?: string;
      linkedin?: string;
      instagram?: string;
    };
  };
  wallet_data?: {
    provider?: string;
    chain_id?: number;
    last_login?: Date;
  };
  auth_method?: 'wallet' | 'email' | 'social';
  onboarding_completed: boolean;
  onboarding_step: number;
  app_kit_user_id?: string;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  address: { type: String, required: true, unique: true, lowercase: true },
  role: { 
    type: String, 
    enum: ['writer', 'producer', 'admin'], 
    required: true 
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  profile_data: {
    name: { type: String },
    email: { type: String },
    image: { type: String },
    bio: { type: String },
    avatar: { type: String },
    website: { type: String },
    company_name: { type: String },
    social: {
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String }
    }
  },
  wallet_data: {
    provider: { type: String },
    chain_id: { type: Number },
    last_login: { type: Date }
  },
  auth_method: { 
    type: String,
    enum: ['wallet', 'email', 'social'],
    default: 'wallet'
  },
  onboarding_completed: { type: Boolean, default: false },
  onboarding_step: { type: Number, default: 0 },
  app_kit_user_id: { type: String, unique: true, sparse: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Add indexes for faster queries
UserSchema.index({ role: 1 });
UserSchema.index({ auth_method: 1 });

// Pre-save hook to ensure lowercase addresses
UserSchema.pre('save', function(this: IUser, next) {
  if (this.address && typeof this.address === 'string') {
    this.address = this.address.toLowerCase();
  }
  next();
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema); 