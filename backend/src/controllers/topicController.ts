import { Request, Response } from 'express';
import Topic from '../models/Topic';
import Festival from '../models/Festival';

export const getTopics = async (req: Request, res: Response) => {
  try {
    const { festivalId } = req.params;
    const { sort = 'newest', parentId, search } = req.query;

    let query: any = {};
    if (festivalId) {
      query.festival = festivalId;
    }
    if (parentId) {
      query.parentComment = parentId;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    let sortOption = {};
    switch (sort) {
      case 'top':
        sortOption = { upvotes: -1 };
        break;
      case 'controversial':
        sortOption = { $expr: { $subtract: ['$upvotes', '$downvotes'] } };
        break;
      case 'views':
        sortOption = { views: -1 };
        break;
      default: // newest
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const topics = await Topic.find(query)
      .populate('user', 'name avatar')
      .populate('festival', 'name')
      .populate({
        path: 'replies',
        populate: [
          {
            path: 'user',
            select: 'name avatar'
          },
          {
            path: 'festival',
            select: 'name'
          }
        ],
        options: { sort: { createdAt: 1 } }
      })
      .sort(sortOption);

    res.json(topics);
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({ message: 'Failed to fetch topics' });
  }
};

export const createTopic = async (req: any, res: Response) => {
  const { title, content, parentComment, tags } = req.body;
  const { festivalId } = req.params;

  // Only require title for top-level topics
  if ((!parentComment && (!title || !content)) || (parentComment && !content)) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    const festivalExists = await Festival.findById(festivalId);
    if (!festivalExists) {
      return res.status(404).json({ message: 'Festival not found' });
    }

    if (parentComment) {
      const parentExists = await Topic.findById(parentComment);
      if (!parentExists) {
        return res.status(404).json({ message: 'Parent topic not found' });
      }
    }

    const topic = await Topic.create({
      user: req.user._id,
      festival: festivalId,
      title,
      content,
      parentComment,
      tags: tags || []
    });

    const populated = await topic.populate('user', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create topic' });
  }
};

export const updateTopic = async (req: any, res: Response) => {
  try {
    const { topicId } = req.params;
    const { title, content, tags } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this topic' });
    }

    topic.title = title || topic.title;
    topic.content = content || topic.content;
    topic.tags = tags || topic.tags;
    topic.isEdited = true;

    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update topic' });
  }
};

export const deleteTopic = async (req: any, res: Response) => {
  try {
    const { topicId } = req.params;
    const { hardDelete } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this topic' });
    }

    if (hardDelete) {
      await Topic.deleteOne({ _id: topicId });
    } else {
      topic.isDeleted = true;
      await topic.save();
    }

    res.json({ message: 'Topic deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete topic' });
  }
};

export const voteTopic = async (req: any, res: Response) => {
  try {
    const { topicId } = req.params;
    const { vote } = req.body;

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const existingVote = topic.voters.find(v => v.user.toString() === req.user._id.toString());
    if (existingVote) {
      if (existingVote.vote === vote) {
        // Remove vote if clicking the same button
        topic.voters = topic.voters.filter(v => v.user.toString() !== req.user._id.toString());
        if (vote === 'up') topic.upvotes--;
        else topic.downvotes--;
      } else {
        // Change vote
        existingVote.vote = vote;
        if (vote === 'up') {
          topic.upvotes++;
          topic.downvotes--;
        } else {
          topic.upvotes--;
          topic.downvotes++;
        }
      }
    } else {
      // Add new vote
      topic.voters.push({ user: req.user._id, vote });
      if (vote === 'up') topic.upvotes++;
      else topic.downvotes++;
    }

    await topic.save();
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to vote on topic' });
  }
};

export const incrementViews = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findByIdAndUpdate(
      topicId,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to increment views' });
  }
};

export const getTopicById = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findById(topicId)
      .populate('user', 'name avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'name avatar'
        },
        options: { sort: { createdAt: 1 } }
      });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch topic' });
  }
}; 