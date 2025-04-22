import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Festival from '../models/Festival';

export const getComments = async (req: Request, res: Response) => {
  try {
    const festivalId = req.params.festivalId;
    const comments = await Comment.find({ festival: festivalId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

export const postComment = async (req: any, res: Response) => {
  const { content } = req.body;
  const { festivalId } = req.params;

  if (!content) return res.status(400).json({ message: 'Content is required' });

  try {
    const festivalExists = await Festival.findById(festivalId);
    if (!festivalExists) return res.status(404).json({ message: 'Festival not found' });

    const comment = await Comment.create({
      user: req.user._id,
      festival: festivalId,
      content,
    });

    const populated = await comment.populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post comment' });
  }
};

export const deleteComment = async (req: any, res: Response) => {
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};
