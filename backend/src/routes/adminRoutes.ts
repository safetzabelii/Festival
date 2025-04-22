import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware';
import {
  getAdminStats,
  exportData,
  getUserManagementData,
  updateUserRole,
  getPendingNonAdminFestivals,
  resetCounts,
  deleteUser
} from '../controllers/adminController';

const router = express.Router();

// Protect all routes with authentication and admin middleware
router.use(protect, isAdmin);

// Stats and analytics
router.get('/stats', getAdminStats);

// Data export
router.post('/export/:type', exportData);

// User management
router.get('/users', getUserManagementData);
router.put('/users/:userId/role', updateUserRole);

// Pending festivals management
router.get('/pending-festivals', getPendingNonAdminFestivals);

router.post('/reset-counts', resetCounts);

router.delete('/users/:userId', deleteUser);

export default router; 