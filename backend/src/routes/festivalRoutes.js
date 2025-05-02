"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const festivalController_1 = require("../controllers/festivalController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Multer processing file:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype
        });
        if (file.mimetype.startsWith('image/')) {
            console.log('File accepted - valid image type');
            cb(null, true);
        }
        else {
            console.log('File rejected - invalid type:', file.mimetype);
            cb(new Error('Only image files are allowed'));
        }
    }
});
// Wrap upload middleware to handle errors
const uploadMiddleware = (req, res, next) => {
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
router.get('/pending', authMiddleware_1.protect, authMiddleware_1.isAdmin, festivalController_1.getUnapprovedFestivals);
router.put('/approve/:id', authMiddleware_1.protect, authMiddleware_1.isAdmin, festivalController_1.approveFestival);
// Public routes
router.get('/', festivalController_1.getFestivals);
router.get('/:id', festivalController_1.getFestivalById);
// Authenticated user routes
router.post('/', authMiddleware_1.protect, uploadMiddleware, festivalController_1.createFestival);
router.put('/:id', authMiddleware_1.protect, uploadMiddleware, festivalController_1.updateFestival);
router.delete('/:id', authMiddleware_1.protect, festivalController_1.deleteFestival);
exports.default = router;
