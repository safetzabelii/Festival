import express from 'express';
import {
  getProfile,
  updateProfile,
  toggleGoing,
  toggleLiked,
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.post('/going/:festivalId', protect, toggleGoing);
router.post('/like/:festivalId', protect, toggleLiked);

export default router;
