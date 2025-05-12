import express from 'express';
import { 
  getTopics, 
  createTopic, 
  updateTopic, 
  deleteTopic, 
  voteTopic,
  incrementViews,
  getTopicById
} from '../controllers/topicController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Get a single topic (must come before /:festivalId route)
router.get('/single/:topicId', getTopicById);

// Get all topics or topics for a specific festival
router.get('/', getTopics);
router.get('/:festivalId', getTopics);

// Create a new topic
router.post('/:festivalId', protect, createTopic);

// Update, delete, and vote on topics
router.put('/:topicId', protect, updateTopic);
router.delete('/:topicId', protect, deleteTopic);
router.post('/:topicId/vote', protect, voteTopic);
router.post('/:topicId/view', incrementViews);

export default router; 