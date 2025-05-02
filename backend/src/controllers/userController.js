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
exports.toggleLiked = exports.toggleGoing = exports.updateProfile = exports.getProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const Festival_1 = __importDefault(require("../models/Festival"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.user._id).populate('goingTo liked');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Handle name update
        if (req.body.name) {
            user.name = req.body.name;
        }
        // Handle social links update
        if (req.body.socialLinks) {
            try {
                const socialLinks = JSON.parse(req.body.socialLinks);
                user.socialLinks = socialLinks;
            }
            catch (err) {
                return res.status(400).json({ message: 'Invalid social links format' });
            }
        }
        // Handle avatar upload
        if (req.file) {
            // Delete old avatar if exists
            if (user.avatar) {
                const oldAvatarPath = path_1.default.join(__dirname, '../../uploads', path_1.default.basename(user.avatar));
                if (fs_1.default.existsSync(oldAvatarPath)) {
                    fs_1.default.unlinkSync(oldAvatarPath);
                }
            }
            // Update avatar path
            user.avatar = `uploads/${req.file.filename}`;
        }
        const updated = yield user.save();
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});
exports.updateProfile = updateProfile;
const toggleGoing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { festivalId } = req.params;
    try {
        const user = yield User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const festival = yield Festival_1.default.findById(festivalId);
        if (!festival)
            return res.status(404).json({ message: 'Festival not found' });
        const index = user.goingTo.indexOf(festivalId);
        if (index > -1) {
            user.goingTo.splice(index, 1);
            festival.goingTo = Math.max(0, (festival.goingTo || 0) - 1);
        }
        else {
            user.goingTo.push(festivalId);
            festival.goingTo = (festival.goingTo || 0) + 1;
        }
        yield Promise.all([user.save(), festival.save()]);
        // Calculate total goingTo across all festivals
        const totalGoingTo = yield Festival_1.default.aggregate([
            { $group: { _id: null, total: { $sum: '$goingTo' } } }
        ]);
        res.json({
            goingTo: user.goingTo,
            festivalGoingTo: festival.goingTo,
            totalGoingTo: ((_a = totalGoingTo[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        });
    }
    catch (err) {
        console.error('Error toggling going status:', err);
        res.status(500).json({ message: 'Failed to toggle going status' });
    }
});
exports.toggleGoing = toggleGoing;
const toggleLiked = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { festivalId } = req.params;
    try {
        const user = yield User_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const festival = yield Festival_1.default.findById(festivalId);
        if (!festival)
            return res.status(404).json({ message: 'Festival not found' });
        // Debug: Log current state
        console.log('Before toggle - User:', {
            userId: user._id,
            likedCount: user.liked.length,
            liked: user.liked
        });
        console.log('Before toggle - Festival:', {
            festivalId: festival._id,
            likes: festival.likes
        });
        const index = user.liked.indexOf(festivalId);
        if (index > -1) {
            user.liked.splice(index, 1);
            festival.likes = Math.max(0, (festival.likes || 0) - 1);
        }
        else {
            // Check if the festival is already in the liked array to prevent duplicates
            if (!user.liked.includes(festivalId)) {
                user.liked.push(festivalId);
                festival.likes = (festival.likes || 0) + 1;
            }
        }
        yield Promise.all([user.save(), festival.save()]);
        // Debug: Log state after update
        console.log('After toggle - User:', {
            userId: user._id,
            likedCount: user.liked.length,
            liked: user.liked
        });
        console.log('After toggle - Festival:', {
            festivalId: festival._id,
            likes: festival.likes
        });
        // Calculate total likes across all festivals
        const totalLikes = yield Festival_1.default.aggregate([
            { $group: { _id: null, total: { $sum: '$likes' } } }
        ]);
        // Debug: Log final counts
        console.log('Total likes calculation:', totalLikes);
        res.json({
            liked: user.liked,
            festivalLikes: festival.likes,
            totalLikes: ((_a = totalLikes[0]) === null || _a === void 0 ? void 0 : _a.total) || 0
        });
    }
    catch (err) {
        console.error('Error toggling liked status:', err);
        res.status(500).json({ message: 'Failed to toggle liked status' });
    }
});
exports.toggleLiked = toggleLiked;
