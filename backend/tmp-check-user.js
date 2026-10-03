const mongoose = require('mongoose');
const User = require('./models/user');
(async ()=> {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
    const u = await User.findOne({ username: 'delta-student' }).lean();
    console.log('FOUND:', u);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
