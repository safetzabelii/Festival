import { Request, Response } from 'express';
import Festival from '../models/Festival';
import User from '../models/User';

// Get admin dashboard statistics
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Basic counts
    const totalFestivals = await Festival.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeUsersThisMonth = await User.countDocuments({
      lastLogin: { $gte: monthStart }
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthStart }
    });
    const pendingApproval = await Festival.countDocuments({ approved: false });

    // Get user engagement stats
    const userStats = await User.aggregate([
      {
        $project: {
          likedCount: { $size: { $ifNull: ['$liked', []] } },
          goingToCount: { $size: { $ifNull: ['$goingTo', []] } },
          totalActions: { 
            $add: [
              { $size: { $ifNull: ['$liked', []] } },
              { $size: { $ifNull: ['$goingTo', []] } }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likedCount' },
          totalGoingTo: { $sum: '$goingToCount' },
          totalUsers: { $sum: 1 },
          averageLikesPerUser: { $avg: '$likedCount' },
          averageGoingToPerUser: { $avg: '$goingToCount' }
        }
      }
    ]);

    // Get most active users
    const mostActiveUsers = await User.aggregate([
      {
        $project: {
          name: 1,
          totalActions: {
            $add: [
              { $size: { $ifNull: ['$liked', []] } },
              { $size: { $ifNull: ['$goingTo', []] } }
            ]
          }
        }
      },
      { $sort: { totalActions: -1 } },
      { $limit: 5 },
      {
        $project: {
          userId: '$_id',
          name: 1,
          totalActions: 1,
          _id: 0
        }
      }
    ]);

    // Get most popular festivals
    const popularFestivals = await Festival.aggregate([
      {
        $project: {
          name: 1,
          city: '$location.city',
          date: '$startDate',
          likes: { $ifNull: ['$likes', 0] },
          goingTo: { $ifNull: ['$goingTo', 0] },
          totalEngagement: {
            $add: [
              { $ifNull: ['$likes', 0] },
              { $ifNull: ['$goingTo', 0] }
            ]
          }
        }
      },
      { $sort: { totalEngagement: -1 } },
      { $limit: 5 }
    ]);

    // Get city statistics
    const cityStats = await Festival.aggregate([
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
          totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
          totalGoingTo: { $sum: { $ifNull: ['$goingTo', 0] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          city: '$_id',
          count: 1,
          totalLikes: 1,
          totalGoingTo: 1,
          _id: 0
        }
      }
    ]);

    // Get genre distribution
    const genreStats = await Festival.aggregate([
      {
        $group: {
          _id: '$genre',
          count: { $sum: 1 },
          totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
          totalGoingTo: { $sum: { $ifNull: ['$goingTo', 0] } }
        }
      },
      {
        $project: {
          genre: '$_id',
          count: 1,
          popularity: {
            $add: ['$totalLikes', '$totalGoingTo']
          },
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly statistics (last 6 months)
    const monthlyStats = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthData = await Promise.all([
        Festival.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        }),
        User.countDocuments({
          lastLogin: { $gte: monthStart, $lt: monthEnd }
        }),
        User.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        }),
        Festival.aggregate([
          {
            $match: {
              createdAt: { $gte: monthStart, $lt: monthEnd }
            }
          },
          {
            $group: {
              _id: null,
              totalLikes: { $sum: { $ifNull: ['$likes', 0] } },
              totalGoingTo: { $sum: { $ifNull: ['$goingTo', 0] } }
            }
          }
        ])
      ]);

      monthlyStats.push({
        month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
        festivals: monthData[0],
        activeUsers: monthData[1],
        newUsers: monthData[2],
        likes: monthData[3][0]?.totalLikes || 0,
        goingTo: monthData[3][0]?.totalGoingTo || 0
      });
    }

    res.json({
      totalFestivals,
      totalUsers,
      totalLikes: userStats[0]?.totalLikes || 0,
      totalGoingTo: userStats[0]?.totalGoingTo || 0,
      activeUsersThisMonth,
      newUsersThisMonth,
      pendingApproval,
      userEngagement: {
        averageLikesPerUser: userStats[0]?.averageLikesPerUser || 0,
        averageGoingToPerUser: userStats[0]?.averageGoingToPerUser || 0,
        mostActiveUsers
      },
      mostPopularFestivals: popularFestivals,
      mostActiveCities: cityStats,
      genreDistribution: genreStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
};

// Export festival data
export const exportData = async (req: Request, res: Response) => {
  try {
    const { type = 'all', format = 'json', dateRange = 'all' } = req.body;
    const now = new Date();
    let dateFilter = {};

    // Apply date filter
    if (dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    } else if (dateRange === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: weekStart } };
    }

    interface ExportData {
      festivals?: any[];
      users?: any[];
    }

    const data: ExportData = {};

    if (type === 'festivals' || type === 'all') {
      const festivals = await Festival.find(dateFilter)
        .populate('createdBy', 'name email')
        .lean();
      data.festivals = festivals;
    }
    
    if (type === 'users' || type === 'all') {
      const users = await User.find(dateFilter)
        .select('-password')
        .lean();
      data.users = users;
    }

    if (format === 'csv') {
      // Convert data to CSV format
      let csv = '';
      if (data.festivals && data.festivals.length > 0) {
        csv += 'Festival Data\n';
        csv += 'ID,Name,Description,City,Country,Start Date,End Date,Genre,Price,Likes,Going\n';
        data.festivals.forEach((f: any) => {
          csv += `${f._id},${f.name},${f.description},${f.location.city},${f.location.country},${f.startDate},${f.endDate},${f.genre},${f.price},${f.likes},${f.goingTo}\n`;
        });
      }
      if (data.users && data.users.length > 0) {
        csv += '\nUser Data\n';
        csv += 'ID,Name,Email,Is Admin,Liked Count,Going Count\n';
        data.users.forEach((u: any) => {
          csv += `${u._id},${u.name},${u.email},${u.isAdmin},${u.liked?.length || 0},${u.goingTo?.length || 0}\n`;
        });
      }
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
};

// Get user management data
export const getUserManagementData = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error getting user management data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
};

// Get all pending festivals
export const getPendingNonAdminFestivals = async (req: Request, res: Response) => {
  try {
    // Find all unapproved festivals
    const pendingFestivals = await Festival.find({
      approved: false
    }).populate('createdBy', 'name email isAdmin');

    console.log('Found pending festivals:', pendingFestivals.length);

    res.json(pendingFestivals);
  } catch (error) {
    console.error('Error getting pending festivals:', error);
    res.status(500).json({ message: 'Error fetching pending festivals' });
  }
};

// Reset all likes and going counts
export const resetCounts = async (req: Request, res: Response) => {
  try {
    // Reset all users' liked and goingTo arrays
    await User.updateMany({}, {
      $set: {
        liked: [],
        goingTo: []
      }
    });

    // Reset all festivals' likes and goingTo counts
    await Festival.updateMany({}, {
      $set: {
        likes: 0,
        goingTo: 0
      }
    });

    console.log('Successfully reset all likes and going counts');
    res.json({ message: 'Successfully reset all counts' });
  } catch (error) {
    console.error('Error resetting counts:', error);
    res.status(500).json({ message: 'Error resetting counts' });
  }
}; 