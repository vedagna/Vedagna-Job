const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    dob: { type: String },
    status: { type: String }
});

// Explicitly specify the collection name
const User = mongoose.model('User', userSchema, 'Users'); // Use 'Users' as the collection name
module.exports = User;
