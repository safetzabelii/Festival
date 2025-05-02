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

router.get('/:festivalId', getTopics);
router.post('/:festivalId', protect, createTopic);
router.put('/:topicId', protect, updateTopic);
router.delete('/:topicId', protect, deleteTopic);
router.post('/:topicId/vote', protect, voteTopic);
router.post('/:topicId/view', incrementViews);
router.get('/single/:topicId', getTopicById);

export default router; 