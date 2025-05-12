"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicById = exports.incrementViews = exports.voteTopic = exports.deleteTopic = exports.updateTopic = exports.createTopic = exports.getTopics = void 0;
const Topic_1 = __importDefault(require("../models/Topic"));
const Festival_1 = __importDefault(require("../models/Festival"));
const getTopics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { festivalId } = req.params;
        const { sort = 'newest', parentId, search } = req.query;
        let query = {};
        if (festivalId) {
            query.festival = festivalId;
        }
        if (parentId) {
            query.parentComment = parentId;
        }
        if (search) {
            query.$text = { $search: search };
        }
        let sortOption = {};
        switch (sort) {
            case 'top':
                sortOption = { upvotes: -1 };
                break;
            case 'controversial':
                sortOption = { $expr: { $subtract: ['$upvotes', '$downvotes'] } };
                break;
            case 'views':
                sortOption = { views: -1 };
                break;
            default: // newest
                sortOption = { isPinned: -1, createdAt: -1 };
        }
        const topics = yield Topic_1.default.find(query)
            .populate('user', 'name avatar')
            .populate('festival', 'name')
            .populate({
            path: 'replies',
            populate: [
                {
                    path: 'user',
                    select: 'name avatar'
                },
                {
                    path: 'festival',
                    select: 'name'
                }
            ],
            options: { sort: { createdAt: 1 } }
        })
            .sort(sortOption);
        res.json(topics);
    }
    catch (err) {
        console.error('Error fetching topics:', err);
        res.status(500).json({ message: 'Failed to fetch topics' });
    }
});
exports.getTopics = getTopics;
const createTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content, parentComment, tags } = req.body;
    const { festivalId } = req.params;
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    try {
        const festivalExists = yield Festival_1.default.findById(festivalId);
        if (!festivalExists) {
            return res.status(404).json({ message: 'Festival not found' });
        }
        if (parentComment) {
            const parentExists = yield Topic_1.default.findById(parentComment);
            if (!parentExists) {
                return res.status(404).json({ message: 'Parent topic not found' });
            }
        }
        const topic = yield Topic_1.default.create({
            user: req.user._id,
            festival: festivalId,
            title,
            content,
            parentComment,
            tags: tags || []
        });
        const populated = yield topic.populate('user', 'name avatar');
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to create topic' });
    }
});
exports.createTopic = createTopic;
const updateTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topicId } = req.params;
        const { title, content, tags } = req.body;
        const topic = yield Topic_1.default.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        if (topic.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this topic' });
        }
        topic.title = title || topic.title;
        topic.content = content || topic.content;
        topic.tags = tags || topic.tags;
        topic.isEdited = true;
        yield topic.save();
        res.json(topic);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to update topic' });
    }
});
exports.updateTopic = updateTopic;
const deleteTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topicId } = req.params;
        const { hardDelete } = req.body;
        const topic = yield Topic_1.default.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        if (topic.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this topic' });
        }
        if (hardDelete) {
            yield Topic_1.default.deleteOne({ _id: topicId });
        }
        else {
            topic.isDeleted = true;
            yield topic.save();
        }
        res.json({ message: 'Topic deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to delete topic' });
    }
});
exports.deleteTopic = deleteTopic;
const voteTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topicId } = req.params;
        const { vote } = req.body;
        const topic = yield Topic_1.default.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        const existingVote = topic.voters.find(v => v.user.toString() === req.user._id.toString());
        if (existingVote) {
            if (existingVote.vote === vote) {
                // Remove vote if clicking the same button
                topic.voters = topic.voters.filter(v => v.user.toString() !== req.user._id.toString());
                if (vote === 'up')
                    topic.upvotes--;
                else
                    topic.downvotes--;
            }
            else {
                // Change vote
                existingVote.vote = vote;
                if (vote === 'up') {
                    topic.upvotes++;
                    topic.downvotes--;
                }
                else {
                    topic.upvotes--;
                    topic.downvotes++;
                }
            }
        }
        else {
            // Add new vote
            topic.voters.push({ user: req.user._id, vote });
            if (vote === 'up')
                topic.upvotes++;
            else
                topic.downvotes++;
        }
        yield topic.save();
        res.json(topic);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to vote on topic' });
    }
});
exports.voteTopic = voteTopic;
const incrementViews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topicId } = req.params;
        const topic = yield Topic_1.default.findByIdAndUpdate(topicId, { $inc: { views: 1 } }, { new: true });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.json(topic);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to increment views' });
    }
});
exports.incrementViews = incrementViews;
const getTopicById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { topicId } = req.params;
        const topic = yield Topic_1.default.findById(topicId)
            .populate('user', 'name avatar')
            .populate({
            path: 'replies',
            populate: {
                path: 'user',
                select: 'name avatar'
            },
            options: { sort: { createdAt: 1 } }
        });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.json(topic);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch topic' });
    }
});
exports.getTopicById = getTopicById;
