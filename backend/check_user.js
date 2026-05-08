const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/fproxy';

async function checkUser() {
  await mongoose.connect(uri);
  
  // Use native MongoDB driver to avoid Mongoose schema issues
  const userSchema = new mongoose.Schema({}, { strict: false });
  const UserNew = mongoose.model('UserNew', userSchema, 'usersNew');
  
  const user = await UserNew.findOne({ _id: 'thanhdeptrai' }).lean();
  
  console.log('User thanhdeptrai:');
  console.log('  _id:', user._id);
  console.log('  role:', user.role);
  console.log('  migration:', user.migration, '(type:', typeof user.migration, ')');
  console.log('  credits:', user.credits);
  
  await mongoose.disconnect();
}

checkUser();
