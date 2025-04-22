import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  user: mongoose.Types.ObjectId;
  festival: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const CommentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    festival: { type: Schema.Types.ObjectId, ref: 'Festival', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', CommentSchema);
