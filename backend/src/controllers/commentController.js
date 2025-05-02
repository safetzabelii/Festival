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
exports.voteComment = exports.deleteComment = exports.updateComment = exports.postComment = exports.getComments = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Festival_1 = __importDefault(require("../models/Festival"));
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const festivalId = req.params.festivalId;
        const { sort = 'newest', parentId } = req.query;
        let query = { festival: festivalId };
        if (parentId) {
            query.parentComment = parentId;
        }
        else {
            query.parentComment = { $exists: false };
        }
        let sortOption = {};
        switch (sort) {
            case 'top':
                sortOption = { upvotes: -1 };
                break;
            case 'controversial':
                sortOption = { $expr: { $subtract: ['$upvotes', '$downvotes'] } };
                break;
            default: // newest
                sortOption = { createdAt: -1 };
        }
        const comments = yield Comment_1.default.find(query)
            .populate('user', 'name avatar')
            .populate({
            path: 'replies',
            populate: {
                path: 'user',
                select: 'name avatar'
            },
            options: { sort: { createdAt: 1 } }
        })
            .sort(sortOption);
        res.json(comments);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch comments' });
    }
});
exports.getComments = getComments;
const postComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, parentComment, tags } = req.body;
    const { festivalId } = req.params;
    if (!content)
        return res.status(400).json({ message: 'Content is required' });
    try {
        const festivalExists = yield Festival_1.default.findById(festivalId);
        if (!festivalExists)
            return res.status(404).json({ message: 'Festival not found' });
        if (parentComment) {
            const parentExists = yield Comment_1.default.findById(parentComment);
            if (!parentExists)
                return res.status(404).json({ message: 'Parent comment not found' });
        }
        const comment = yield Comment_1.default.create({
            user: req.user._id,
            festival: festivalId,
            content,
            parentComment,
            tags: tags || []
        });
        const populated = yield comment.populate('user', 'name avatar');
        res.status(201).json(populated);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to post comment' });
    }
});
exports.postComment = postComment;
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { content, tags } = req.body;
    const { id } = req.params;
    try {
        const comment = yield Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });
        if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        comment.content = content;
        comment.tags = tags || comment.tags;
        comment.isEdited = true;
        yield comment.save();
        const updated = yield comment.populate('user', 'name avatar');
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to update comment' });
    }
});
exports.updateComment = updateComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { softDelete, hardDelete } = req.body;
    try {
        const comment = yield Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });
        const isOwner = comment.user.toString() === req.user._id.toString();
        const isAdmin = req.user.isAdmin;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        // Force hard delete if specified (for cleanup) or if no replies and not soft delete
        if (hardDelete || (!softDelete && !(yield Comment_1.default.exists({ parentComment: id })))) {
            yield Comment_1.default.findByIdAndDelete(id);
            return res.json({ message: 'Comment permanently deleted', comment: null });
        }
        // Soft-delete: mark as deleted, keep replies, clear stats
        comment.isDeleted = true;
        comment.content = 'Comment deleted';
        comment.upvotes = 0;
        comment.downvotes = 0;
        comment.voters = [];
        yield comment.save();
        res.json({ message: 'Comment soft deleted', comment });
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to delete comment' });
    }
});
exports.deleteComment = deleteComment;
const voteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { vote } = req.body; // 'up' or 'down'
    if (!['up', 'down'].includes(vote)) {
        return res.status(400).json({ message: 'Invalid vote type' });
    }
    try {
        const comment = yield Comment_1.default.findById(id);
        if (!comment)
            return res.status(404).json({ message: 'Comment not found' });
        const existingVote = comment.voters.find(v => v.user.toString() === req.user._id.toString());
        if (existingVote) {
            if (existingVote.vote === vote) {
                // Remove vote if clicking same button
                comment.voters = comment.voters.filter(v => v.user.toString() !== req.user._id.toString());
                if (vote === 'up')
                    comment.upvotes--;
                else
                    comment.downvotes--;
            }
            else {
                // Change vote
                existingVote.vote = vote;
                if (vote === 'up') {
                    comment.upvotes++;
                    comment.downvotes--;
                }
                else {
                    comment.upvotes--;
                    comment.downvotes++;
                }
            }
        }
        else {
            // Add new vote
            comment.voters.push({ user: req.user._id, vote });
            if (vote === 'up')
                comment.upvotes++;
            else
                comment.downvotes++;
        }
        yield comment.save();
        const populated = yield comment.populate('user', 'name avatar');
        res.json(populated);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to vote on comment' });
    }
});
exports.voteComment = voteComment;
