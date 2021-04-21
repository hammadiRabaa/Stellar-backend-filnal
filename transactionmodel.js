


var mongoose = require('mongoose');
var schema = new mongoose.Schema({
    receiver: { type: Number },
    amount: { type: String },
    sender: { type: Number },
 //to crypt keypairs
    createdAt: {
        type: Date,
        default: Date.now()
    },

});
 
var Transaction = mongoose.model('Transaction', schema);

module.exports = Transaction;
