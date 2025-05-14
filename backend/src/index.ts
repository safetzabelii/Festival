import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { join } from 'path';
//import { startReminderScheduler } from './utils/reminderScheduler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import festivalRoutes from './routes/festivalRoutes';
import commentRoutes from './routes/commentRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import topicRoutes from './routes/topicRoutes';
import path from 'path';

dotenv.config();

// Connect to MongoDB - using the central connection function
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Use env variable for frontend URL
  credentials: true
}));

// Configure Helmet with necessary adjustments for image serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
const publicPath = join(process.cwd(), 'public');
console.log('Public directory path:', publicPath);
// Serve all static files from the public directory
app.use(express.static(publicPath));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to FestivalSphere API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/topics', topicRoutes);

//startReminderScheduler();

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Removed duplicate MongoDB connection here

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
