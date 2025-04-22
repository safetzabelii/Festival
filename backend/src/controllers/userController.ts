import { Request, Response } from 'express';
import User from '../models/User';
import asyncHandler from 'express-async-handler';
import Festival from '../models/Festival';


export const getProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).populate('goingTo liked');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, avatar, socialLinks } = req.body;
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (socialLinks) user.socialLinks = socialLinks;

    const updated = await user.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const toggleGoing = async (req: any, res: Response) => {
  const { festivalId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const festival = await Festival.findById(festivalId);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });

    const index = user.goingTo.indexOf(festivalId);
    if (index > -1) {
      user.goingTo.splice(index, 1);
      festival.goingTo = Math.max(0, (festival.goingTo || 0) - 1);
    } else {
      user.goingTo.push(festivalId);
      festival.goingTo = (festival.goingTo || 0) + 1;
    }

    await Promise.all([user.save(), festival.save()]);

    // Calculate total goingTo across all festivals
    const totalGoingTo = await Festival.aggregate([
      { $group: { _id: null, total: { $sum: '$goingTo' } } }
    ]);

    res.json({
      goingTo: user.goingTo,
      festivalGoingTo: festival.goingTo,
      totalGoingTo: totalGoingTo[0]?.total || 0
    });
  } catch (err) {
    console.error('Error toggling going status:', err);
    res.status(500).json({ message: 'Failed to toggle going status' });
  }
};

export const toggleLiked = async (req: any, res: Response) => {
  const { festivalId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const festival = await Festival.findById(festivalId);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });

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
    } else {
      // Check if the festival is already in the liked array to prevent duplicates
      if (!user.liked.includes(festivalId)) {
        user.liked.push(festivalId);
        festival.likes = (festival.likes || 0) + 1;
      }
    }

    await Promise.all([user.save(), festival.save()]);

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
    const totalLikes = await Festival.aggregate([
      { $group: { _id: null, total: { $sum: '$likes' } } }
    ]);

    // Debug: Log final counts
    console.log('Total likes calculation:', totalLikes);

    res.json({
      liked: user.liked,
      festivalLikes: festival.likes,
      totalLikes: totalLikes[0]?.total || 0
    });
  } catch (err) {
    console.error('Error toggling liked status:', err);
    res.status(500).json({ message: 'Failed to toggle liked status' });
  }
};
  
