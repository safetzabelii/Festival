import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  isAdmin: boolean;
  goingTo: mongoose.Types.ObjectId[];
  liked: mongoose.Types.ObjectId[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  createdAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: String,
    isAdmin: { type: Boolean, default: false },
    goingTo: [{ type: Schema.Types.ObjectId, ref: 'Festival' }],
    liked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Festival' }],
    socialLinks: {
      instagram: String,
      twitter: String,
      website: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
