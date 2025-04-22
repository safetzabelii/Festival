import { Request, Response } from 'express';
import Notification from '../models/Notification';

// GET /api/notifications
export const getUserNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

// PUT /api/notifications/:id/read
export const markNotificationRead = async (req: any, res: Response) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    if (notif.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notif.read = true;
    const updated = await notif.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
};
