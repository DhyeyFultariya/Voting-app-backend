const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');


const userSchema = new Schema({
    name : {
        type : String,  
        required : true,
    },
    age : {
        type : Number,
        required : true,
    },
    email : {
        type : String,
    }, 
    mobile : {
        type : String,
    },
    password : {
        type : String,
        required : true,
    },
    address : {
        type : String,
        required : true,
    },
    aadharCard : {
        type : Number,
        required : true,
        unique : true,
    },
    role : {
        type : String,
        enum : ['admin', 'voter'],
        default : 'voter',
    },
    isVoted : {
        type : Boolean,
        default : false,
    },
})

userSchema.pre('save', async function(next) {
    const user = this;

    if(!user.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(user.password, salt);

        user.password = hashedPassword;
        next();

    } catch (error) {
        return next(error);
    }
})

userSchema.methods.comparePassword = async function(candidatePassword) {
    try{
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch
    } catch (error) {
        throw error;
    }
}


module.exports = mongoose.model('User', userSchema);