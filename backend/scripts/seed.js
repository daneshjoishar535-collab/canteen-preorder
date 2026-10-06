// Creates an admin user, a demo student, sample menu and pickup slots for today + the next 2 days.
// Safe to run again (upserts, nothing is duplicated).  Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Slot = require('../src/models/Slot');

// YYYY-MM-DD in the canteen's timezone (default IST), `days` from today
const canteenDate = (days) => {
  const [, sign, h, m] = (process.env.CANTEEN_TZ_OFFSET || '+05:30').match(/([+-])(\d{2}):(\d{2})/);
  const offsetMs = (sign === '-' ? -1 : 1) * (Number(h) * 60 + Number(m)) * 60000;
  return new Date(Date.now() + offsetMs + days * 86400000).toISOString().slice(0, 10);
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  let admin = await User.findOne({ email: 'admin@canteen.com' });
  if (!admin) admin = await User.create({ name: 'Canteen Admin', email: 'admin@canteen.com', password: 'admin123', role: 'admin' });
  if (!(await User.findOne({ email: 'student@college.edu' }))) {
    await User.create({ name: 'Demo Student', email: 'student@college.edu', password: 'student123' });
  }

  const menu = [
    ['Masala Dosa', 'Crispy dosa with potato filling', 60, 'breakfast'],
    ['Veg Thali', 'Roti, rice, dal, sabzi, salad', 90, 'lunch'],
    ['Paneer Wrap', 'Grilled paneer roll', 70, 'snacks'],
    ['Veg Sandwich', 'Grilled veg sandwich', 40, 'snacks'],
    ['Masala Chai', 'Hot tea', 15, 'beverages'],
    ['Cold Coffee', 'Iced coffee', 40, 'beverages'],
    ['Gulab Jamun', '2 pieces', 30, 'desserts'],
  ];
  for (const [name, description, price, category] of menu) {
    await MenuItem.updateOne({ name }, { $setOnInsert: { name, description, price, category, createdBy: admin._id } }, { upsert: true });
  }

  const times = ['09:00', '10:30', '12:00', '12:30', '13:00', '13:30', '15:00', '16:30', '18:00', '20:00'];
  for (const days of [0, 1, 2]) {
    const date = canteenDate(days);
    for (const time of times) {
      await Slot.updateOne(
        { date, time },
        { $setOnInsert: { date, time, maxOrders: 10, currentOrders: 0, createdBy: admin._id } },
        { upsert: true }
      );
    }
  }

  console.log('Seed complete.\n Admin:   admin@canteen.com / admin123\n Student: student@college.edu / student123');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
