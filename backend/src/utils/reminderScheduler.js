"use strict";
// import cron from 'node-cron';
// import User from '../models/User';
// import Festival from '../models/Festival';
// import Notification from '../models/Notification';
// export const startReminderScheduler = () => {
//   cron.schedule('0 9 * * *', async () => {
//     const tomorrow = new Date();
//     tomorrow.setDate(tomorrow.getDate() + 1);
//     const start = new Date(tomorrow.setHours(0, 0, 0, 0));
//     const end = new Date(tomorrow.setHours(23, 59, 59, 999));
//     const festivals = await Festival.find({
//       startDate: { $gte: start, $lte: end },
//       approved: true,
//     });
//     for (const fest of festivals) {
//       const users = await User.find({ goingTo: fest._id });
//       for (const user of users) {
//         await Notification.create({
//           user: user._id,
//           message: `🎉 "${fest.name}" starts tomorrow in ${fest.location.city}`,
//           link: `/festivals/${fest._id}`,
//         });
//       }
//     }
//   });
//   console.log('✅ In-app reminder scheduler started');
// };
