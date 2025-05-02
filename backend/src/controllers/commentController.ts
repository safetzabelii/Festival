import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Festival from '../models/Festival';

export const getComments = async (req: Request, res: Response) => {
  try {
    const festivalId = req.params.festivalId;
    const { sort = 'newest', parentId } = req.query;

    let query: any = { festival: festivalId };
    if (parentId) {
      query.parentComment = parentId;
    } else {
      query.parentComment = { $exists: false };
    }

    let sortOption = {};
    switch (sort) {
      case 'top':
        sortOption = { upvotes: -1 };
        break;
      case 'controversial':
        sortOption = { $expr: { $subtract: ['$upvotes', '$downvotes'] } };
        break;
      default: // newest
        sortOption = { createdAt: -1 };
    }

    const comments = await Comment.find(query)
      .populate('user', 'name avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: 1 } }
      })
      .sort(sortOption);

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
};

export const postComment = async (req: any, res: Response) => {
  const { content, parentComment, tags } = req.body;
  const { festivalId } = req.params;

  if (!content) return res.status(400).json({ message: 'Content is required' });

  try {
    const festivalExists = await Festival.findById(festivalId);
    if (!festivalExists) return res.status(404).json({ message: 'Festival not found' });

    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) return res.status(404).json({ message: 'Parent comment not found' });
    }

    const comment = await Comment.create({
      user: req.user._id,
      festival: festivalId,
      content,
      parentComment,
      tags: tags || []
    });

    const populated = await comment.populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post comment' });
  }
};

export const updateComment = async (req: any, res: Response) => {
  const { content, tags } = req.body;
  const { id } = req.params;

  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.content = content;
    comment.tags = tags || comment.tags;
    comment.isEdited = true;
    await comment.save();

    const updated = await comment.populate('user', 'name avatar');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update comment' });
  }
};

export const deleteComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { softDelete, hardDelete } = req.body;

  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAdmin = req.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Force hard delete if specified (for cleanup) or if no replies and not soft delete
    if (hardDelete || (!softDelete && !(await Comment.exists({ parentComment: id })))) {
      await Comment.findByIdAndDelete(id);
      return res.json({ message: 'Comment permanently deleted', comment: null });
    }

    // Soft-delete: mark as deleted, keep replies, clear stats
    comment.isDeleted = true;
    comment.content = 'Comment deleted';
    comment.upvotes = 0;
    comment.downvotes = 0;
    comment.voters = [];
    await comment.save();
    res.json({ message: 'Comment soft deleted', comment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
};

export const voteComment = async (req: any, res: Response) => {
  const { id } = req.params;
  const { vote } = req.body; // 'up' or 'down'

  if (!['up', 'down'].includes(vote)) {
    return res.status(400).json({ message: 'Invalid vote type' });
  }

  try {
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const existingVote = comment.voters.find(v => v.user.toString() === req.user._id.toString());
    
    if (existingVote) {
      if (existingVote.vote === vote) {
        // Remove vote if clicking same button
        comment.voters = comment.voters.filter(v => v.user.toString() !== req.user._id.toString());
        if (vote === 'up') comment.upvotes--;
        else comment.downvotes--;
      } else {
        // Change vote
        existingVote.vote = vote;
        if (vote === 'up') {
          comment.upvotes++;
          comment.downvotes--;
        } else {
          comment.upvotes--;
          comment.downvotes++;
        }
      }
    } else {
      // Add new vote
      comment.voters.push({ user: req.user._id, vote });
      if (vote === 'up') comment.upvotes++;
      else comment.downvotes++;
    }

    await comment.save();
    const populated = await comment.populate('user', 'name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to vote on comment' });
  }
};
