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
exports.markNotificationRead = exports.getUserNotifications = void 0;
const Notification_1 = __importDefault(require("../models/Notification"));
// GET /api/notifications
const getUserNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield Notification_1.default.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});
exports.getUserNotifications = getUserNotifications;
// PUT /api/notifications/:id/read
const markNotificationRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notif = yield Notification_1.default.findById(req.params.id);
        if (!notif)
            return res.status(404).json({ message: 'Notification not found' });
        if (notif.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        notif.read = true;
        const updated = yield notif.save();
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ message: 'Failed to update notification' });
    }
});
exports.markNotificationRead = markNotificationRead;
