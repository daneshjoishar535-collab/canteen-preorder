// Creates an admin user, sample menu and slots for tomorrow.  Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Slot = require('../src/models/Slot');

const ymd = (d) => d.toISOString().slice(0, 10);

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

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  for (const time of ['12:30', '12:45', '13:00', '13:15', '13:30']) {
    await Slot.updateOne(
      { date: ymd(tomorrow), time },
      { $setOnInsert: { date: ymd(tomorrow), time, maxOrders: 10, currentOrders: 0, createdBy: admin._id } },
      { upsert: true }
    );
  }

  console.log('Seed complete.\n Admin:   admin@canteen.com / admin123\n Student: student@college.edu / student123');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
