import express from 'express';
import { 
  getComments, 
  postComment, 
  deleteComment, 
  updateComment,
  voteComment 
} from '../controllers/commentController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/:festivalId', getComments);
router.post('/:festivalId', protect, postComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/vote', protect, voteComment);

export default router;
