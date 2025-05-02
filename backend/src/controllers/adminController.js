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
exports.deleteUser = exports.resetCounts = exports.getPendingNonAdminFestivals = exports.updateUserRole = exports.getUserManagementData = exports.exportData = exports.getAdminStats = void 0;
const Festival_1 = __importDefault(require("../models/Festival"));
const User_1 = __importDefault(require("../models/User"));
const Comment_1 = __importDefault(require("../models/Comment"));
const Notification_1 = __importDefault(require("../models/Notification"));
// Get admin dashboard statistics
const getAdminStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Basic counts
        const totalFestivals = yield Festival_1.default.countDocuments();
        const totalUsers = yield User_1.default.countDocuments();
        const activeUsersThisMonth = yield User_1.default.countDocuments({
            lastLogin: { $gte: monthStart }
        });
        const newUsersThisMonth = yield User_1.default.countDocuments({
            createdAt: { $gte: monthStart }
        });
        const pendingApproval = yield Festival_1.default.countDocuments({ approved: false });
        // Get user engagement stats
        const userStats = yield User_1.default.aggregate([
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
        const mostActiveUsers = yield User_1.default.aggregate([
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
        const popularFestivals = yield Festival_1.default.aggregate([
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
        const cityStats = yield Festival_1.default.aggregate([
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
        const genreStats = yield Festival_1.default.aggregate([
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
            const monthData = yield Promise.all([
                Festival_1.default.countDocuments({
                    createdAt: { $gte: monthStart, $lt: monthEnd }
                }),
                User_1.default.countDocuments({
                    lastLogin: { $gte: monthStart, $lt: monthEnd }
                }),
                User_1.default.countDocuments({
                    createdAt: { $gte: monthStart, $lt: monthEnd }
                }),
                Festival_1.default.aggregate([
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
                likes: ((_a = monthData[3][0]) === null || _a === void 0 ? void 0 : _a.totalLikes) || 0,
                goingTo: ((_b = monthData[3][0]) === null || _b === void 0 ? void 0 : _b.totalGoingTo) || 0
            });
        }
        res.json({
            totalFestivals,
            totalUsers,
            totalLikes: ((_c = userStats[0]) === null || _c === void 0 ? void 0 : _c.totalLikes) || 0,
            totalGoingTo: ((_d = userStats[0]) === null || _d === void 0 ? void 0 : _d.totalGoingTo) || 0,
            activeUsersThisMonth,
            newUsersThisMonth,
            pendingApproval,
            userEngagement: {
                averageLikesPerUser: ((_e = userStats[0]) === null || _e === void 0 ? void 0 : _e.averageLikesPerUser) || 0,
                averageGoingToPerUser: ((_f = userStats[0]) === null || _f === void 0 ? void 0 : _f.averageGoingToPerUser) || 0,
                mostActiveUsers
            },
            mostPopularFestivals: popularFestivals,
            mostActiveCities: cityStats,
            genreDistribution: genreStats,
            monthlyStats
        });
    }
    catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({ message: 'Error fetching admin statistics' });
    }
});
exports.getAdminStats = getAdminStats;
// Export festival data
const exportData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type = 'all', format = 'json', dateRange = 'all' } = req.body;
        const now = new Date();
        let dateFilter = {};
        // Apply date filter
        if (dateRange === 'month') {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            dateFilter = { createdAt: { $gte: monthStart } };
        }
        else if (dateRange === 'week') {
            const weekStart = new Date(now.setDate(now.getDate() - 7));
            dateFilter = { createdAt: { $gte: weekStart } };
        }
        const data = {};
        if (type === 'festivals' || type === 'all') {
            const festivals = yield Festival_1.default.find(dateFilter)
                .populate('createdBy', 'name email')
                .lean();
            data.festivals = festivals;
        }
        if (type === 'users' || type === 'all') {
            const users = yield User_1.default.find(dateFilter)
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
                data.festivals.forEach((f) => {
                    csv += `${f._id},${f.name},${f.description},${f.location.city},${f.location.country},${f.startDate},${f.endDate},${f.genre},${f.price},${f.likes},${f.goingTo}\n`;
                });
            }
            if (data.users && data.users.length > 0) {
                csv += '\nUser Data\n';
                csv += 'ID,Name,Email,Is Admin,Liked Count,Going Count\n';
                data.users.forEach((u) => {
                    var _a, _b;
                    csv += `${u._id},${u.name},${u.email},${u.isAdmin},${((_a = u.liked) === null || _a === void 0 ? void 0 : _a.length) || 0},${((_b = u.goingTo) === null || _b === void 0 ? void 0 : _b.length) || 0}\n`;
                });
            }
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);
        }
        else {
            res.json(data);
        }
    }
    catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({ message: 'Error exporting data' });
    }
});
exports.exportData = exportData;
// Get user management data
const getUserManagementData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find().select('-password');
        res.json(users);
    }
    catch (error) {
        console.error('Error getting user management data:', error);
        res.status(500).json({ message: 'Error fetching user data' });
    }
});
exports.getUserManagementData = getUserManagementData;
// Update user role
const updateUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;
        const user = yield User_1.default.findByIdAndUpdate(userId, { isAdmin }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role' });
    }
});
exports.updateUserRole = updateUserRole;
// Get all pending festivals
const getPendingNonAdminFestivals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Find all unapproved festivals
        const pendingFestivals = yield Festival_1.default.find({
            approved: false
        }).populate('createdBy', 'name email isAdmin');
        console.log('Found pending festivals:', pendingFestivals.length);
        res.json(pendingFestivals);
    }
    catch (error) {
        console.error('Error getting pending festivals:', error);
        res.status(500).json({ message: 'Error fetching pending festivals' });
    }
});
exports.getPendingNonAdminFestivals = getPendingNonAdminFestivals;
// Reset all likes and going counts
const resetCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Reset all users' liked and goingTo arrays
        yield User_1.default.updateMany({}, {
            $set: {
                liked: [],
                goingTo: []
            }
        });
        // Reset all festivals' likes and goingTo counts
        yield Festival_1.default.updateMany({}, {
            $set: {
                likes: 0,
                goingTo: 0
            }
        });
        console.log('Successfully reset all likes and going counts');
        res.json({ message: 'Successfully reset all counts' });
    }
    catch (error) {
        console.error('Error resetting counts:', error);
        res.status(500).json({ message: 'Error resetting counts' });
    }
});
exports.resetCounts = resetCounts;
// Delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const user = yield User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Delete user's comments
        yield Comment_1.default.deleteMany({ user: userId });
        // Delete user's notifications
        yield Notification_1.default.deleteMany({ user: userId });
        // Remove user's likes and going-to counts from festivals
        const festivalsToUpdate = [...user.liked, ...user.goingTo];
        yield Festival_1.default.updateMany({ _id: { $in: festivalsToUpdate } }, {
            $inc: {
                likes: -1,
                goingTo: -1
            }
        });
        // Delete the user
        yield User_1.default.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});
exports.deleteUser = deleteUser;
