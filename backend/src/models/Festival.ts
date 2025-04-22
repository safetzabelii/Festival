import mongoose, { Document, Schema } from 'mongoose';

export interface IFestival extends Document {
  name: string;
  description: string;
  location: {
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate: Date;
  endDate: Date;
  genre: string;
  price: number;
  isFree: boolean;
  website?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
  };
  imageUrl?: string;
  lineup?: string[];
  createdBy: mongoose.Types.ObjectId;
  approved: boolean;
  likes: number;
  goingTo: number;
  createdAt: Date;
  updatedAt: Date;
}

const FestivalSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: {
      city: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    genre: { type: String, required: true },
    price: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    website: String,
    socialLinks: {
      instagram: String,
      twitter: String,
    },
    imageUrl: String,
    lineup: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approved: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    goingTo: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model<IFestival>('Festival', FestivalSchema);
