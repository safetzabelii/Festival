import express from 'express';
import {
  getProfile,
  updateProfile,
  toggleGoing,
  toggleLiked,
} from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();

router.get('/me', protect, getProfile);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.post('/me/going/:festivalId', protect, toggleGoing);
router.post('/me/liked/:festivalId', protect, toggleLiked);

export default router;
