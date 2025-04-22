import express from 'express';
import multer from 'multer';
import {
  getFestivals,
  getFestivalById,
  createFestival,
  updateFestival,
  deleteFestival,
  getUnapprovedFestivals,
  approveFestival,
} from '../controllers/festivalController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    console.log('Multer processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted - valid image type');
      cb(null, true);
    } else {
      console.log('File rejected - invalid type:', file.mimetype);
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Wrap upload middleware to handle errors
const uploadMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: err.message });
    }
    console.log('File upload successful:', req.file);
    next();
  });
};

// Admin-only moderation routes
router.get('/pending', protect, isAdmin, getUnapprovedFestivals);
router.put('/approve/:id', protect, isAdmin, approveFestival);
// Public routes
router.get('/', getFestivals);
router.get('/:id', getFestivalById);

// Authenticated user routes
router.post('/', protect, uploadMiddleware, createFestival);
router.put('/:id', protect, uploadMiddleware, updateFestival);
router.delete('/:id', protect, deleteFestival);

export default router;
