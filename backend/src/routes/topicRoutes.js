"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const topicController_1 = require("../controllers/topicController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Get a single topic (must come before /:festivalId route)
router.get('/single/:topicId', topicController_1.getTopicById);
// Get all topics or topics for a specific festival
router.get('/', topicController_1.getTopics);
router.get('/:festivalId', topicController_1.getTopics);
// Create a new topic
router.post('/:festivalId', authMiddleware_1.protect, topicController_1.createTopic);
// Update, delete, and vote on topics
router.put('/:topicId', authMiddleware_1.protect, topicController_1.updateTopic);
router.delete('/:topicId', authMiddleware_1.protect, topicController_1.deleteTopic);
router.post('/:topicId/vote', authMiddleware_1.protect, topicController_1.voteTopic);
router.post('/:topicId/view', topicController_1.incrementViews);
exports.default = router;
