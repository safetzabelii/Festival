"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const path_1 = require("path");
//import { startReminderScheduler } from './utils/reminderScheduler';
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const festivalRoutes_1 = __importDefault(require("./routes/festivalRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/commentRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const topicRoutes_1 = __importDefault(require("./routes/topicRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const path_2 = __importDefault(require("path"));
dotenv_1.default.config();
// Connect to MongoDB
(0, db_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Configure CORS
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Frontend URL
    credentials: true
}));
// Configure Helmet with necessary adjustments for image serving
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the public directory
const publicPath = (0, path_1.join)(process.cwd(), 'public');
console.log('Public directory path:', publicPath);
// Serve all static files from the public directory
app.use(express_1.default.static(publicPath));
// Serve static files from uploads directory
app.use('/uploads', express_1.default.static(path_2.default.join(__dirname, '../uploads')));
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to FestivalSphere API' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/festivals', festivalRoutes_1.default);
app.use('/api/comments', commentRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/topics', topicRoutes_1.default);
//startReminderScheduler();
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/festival-sphere')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
