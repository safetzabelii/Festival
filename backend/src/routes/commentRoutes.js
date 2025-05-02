"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const commentController_1 = require("../controllers/commentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.get('/:festivalId', commentController_1.getComments);
router.post('/:festivalId', authMiddleware_1.protect, commentController_1.postComment);
router.put('/:id', authMiddleware_1.protect, commentController_1.updateComment);
router.delete('/:id', authMiddleware_1.protect, commentController_1.deleteComment);
router.post('/:id/vote', authMiddleware_1.protect, commentController_1.voteComment);
exports.default = router;
