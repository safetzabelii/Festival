import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  user: mongoose.Types.ObjectId;
  festival: mongoose.Types.ObjectId;
  title: string;
  content: string;
  parentComment?: mongoose.Types.ObjectId;
  upvotes: number;
  downvotes: number;
  voters: {
    user: mongoose.Types.ObjectId;
    vote: 'up' | 'down';
  }[];
  tags: string[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  views: number;
  isPinned: boolean;
}

const TopicSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    festival: { type: Schema.Types.ObjectId, ref: 'Festival', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Topic' },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    voters: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      vote: { type: String, enum: ['up', 'down'] }
    }],
    tags: [{ type: String }],
    isEdited: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for replies
TopicSchema.virtual('replies', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'parentComment'
});

// Indexes for better query performance
TopicSchema.index({ festival: 1, createdAt: -1 });
TopicSchema.index({ festival: 1, isPinned: -1, createdAt: -1 });
TopicSchema.index({ title: 'text', content: 'text' });

export default mongoose.model<ITopic>('Topic', TopicSchema); 