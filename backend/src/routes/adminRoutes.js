"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const adminController_1 = require("../controllers/adminController");
const router = express_1.default.Router();
// Protect all routes with authentication and admin middleware
router.use(authMiddleware_1.protect, authMiddleware_1.isAdmin);
// Stats and analytics
router.get('/stats', adminController_1.getAdminStats);
// Data export
router.post('/export/:type', adminController_1.exportData);
// User management
router.get('/users', adminController_1.getUserManagementData);
router.put('/users/:userId/role', adminController_1.updateUserRole);
// Pending festivals management
router.get('/pending-festivals', adminController_1.getPendingNonAdminFestivals);
router.post('/reset-counts', adminController_1.resetCounts);
router.delete('/users/:userId', adminController_1.deleteUser);
exports.default = router;
