require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');

const DEMO_USERS = [
  {
    email: 'demo@kanri.com',
    password: 'demo12345',
    tasks: [
      { title: 'Review project requirements', note: 'Stay focused — one task at a time.', status: 'pending' },
      { title: 'Complete morning standup notes', note: 'Keep it short and actionable.', status: 'done' },
      { title: 'Finish API documentation', note: 'Document auth and task endpoints.', status: 'pending' },
    ],
  },
  {
    email: 'focus@kanri.com',
    password: 'focus12345',
    tasks: [
      { title: 'Deep work: 2 hours coding', note: 'No distractions until done.', status: 'pending' },
      { title: 'Plan tomorrow\'s priorities', note: 'Write top 3 tasks for tomorrow.', status: 'pending' },
      { title: 'Inbox zero', note: 'Clear emails and messages.', status: 'done' },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const demo of DEMO_USERS) {
    let user = await User.findOne({ email: demo.email });

    if (!user) {
      user = await User.create({ email: demo.email, password: demo.password });
      console.log(`Created user: ${demo.email}`);
    } else {
      console.log(`User exists: ${demo.email}`);
    }

    const existingTasks = await Task.countDocuments({ userId: user._id });
    if (existingTasks === 0) {
      await Task.insertMany(
        demo.tasks.map((t) => ({ ...t, userId: user._id }))
      );
      console.log(`  Added ${demo.tasks.length} sample tasks`);
    } else {
      console.log(`  Tasks already exist (${existingTasks})`);
    }
  }

  console.log('\n--- Demo accounts ---');
  DEMO_USERS.forEach((u) => {
    console.log(`Email:    ${u.email}`);
    console.log(`Password: ${u.password}`);
    console.log('');
  });

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
