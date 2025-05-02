"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = __importDefault(require("../middleware/uploadMiddleware"));
const router = express_1.default.Router();
router.get('/me', authMiddleware_1.protect, userController_1.getProfile);
router.put('/me', authMiddleware_1.protect, uploadMiddleware_1.default.single('avatar'), userController_1.updateProfile);
router.post('/me/going/:festivalId', authMiddleware_1.protect, userController_1.toggleGoing);
router.post('/me/liked/:festivalId', authMiddleware_1.protect, userController_1.toggleLiked);
exports.default = router;
