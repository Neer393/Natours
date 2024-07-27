const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,'An account holder must have a name']
    },
    email:{
        type:String,
        required:[true,'An account holder must have an email'],
        unique:true,
        lowercase:true,
        validate:[validator.isEmail,'The email address is not valid']
    },
    photo:String,
    password:{
        type:String,
        required:[true,'An account requires a password'],
        minlength:8,
        select:false
    },
    confirmPassword:{
        type:String,
        required:[true,'An account needs to confirm password'],
        validate:[function(el){
            return el===this.password;
        },'Password and confirm Password do not match']
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    passwordChangedAt:Date,
    passwordResetToken: String,
    passwordResetTokenExpires : Date
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password'))    return next();

    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = undefined;
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew)  return next();

    this.passwordChangedAt = Date.now()-1000;
    next();
})

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetTokenExpires = Date.now() + 10*60*1000;
    return resetToken;
}

const User =  mongoose.model('User',userSchema);

module.exports = User;