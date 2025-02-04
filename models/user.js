const mongoose = require('mongoose');
const connection = mongoose.connect('mongodb://127.0.0.1:27017/ecommerceWebsite');
if (connection) console.log("Mongo connected successfully")
const userSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    posts: [
        { type: mongoose.Schema.Types.ObjectId,ref:'post' }
    ]
})

module.exports = mongoose.model('user', userSchema);