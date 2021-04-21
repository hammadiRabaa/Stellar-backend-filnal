var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var schema = new mongoose.Schema({
  phone: { type: Number, required: true, unique: 'That phone is already taken' },
  password: { type: String, required: true, unique: true },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  address: { type: String, required: true, unique: true },
  balance: { type: Number, required: true, unique: true },

  seed: { type: String, required: true, unique: true },
  isVerified: { type: Boolean, default: false },
  admin: Boolean
});
var User = mongoose.model('User', schema);
schema.plugin(uniqueValidator, { message: 'phone number already taken  .' });

module.exports = User;
