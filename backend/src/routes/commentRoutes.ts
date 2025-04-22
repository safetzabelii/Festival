import express from 'express';
import { getComments, postComment, deleteComment } from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:festivalId', getComments);
router.post('/:festivalId', protect, postComment);
router.delete('/:id', protect, deleteComment);

export default router;
