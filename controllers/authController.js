const User = require('./../models/userModel.js');
const crypto = require('crypto');
const {promisify} = require('util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError.js');
const catchAsync = require('./../utils/catchAsyncError.js');
const sendEmail = require('./../utils/emailer.js');

const sendToken = (user,statuscode,res)=>{
    const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
    res.cookie('jwt',token,{
        expires:new Date(Date.now()+90*24*60*60*1000),
        httpOnly:true
    });
    user.password=undefined;
    res.status(statuscode).json({
        status:'success',
        token,
        user
    })
}

exports.signup = catchAsync(async(req,res,next)=>{
    const newUser = await User.create(req.body);
    sendToken(newUser,200,res);
});

exports.login = catchAsync(async(req,res,next)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return next(new AppError("Either email address or password is missing",404));
    }
    const searchUser = await User.findOne({email}).select('+password');
    if(!searchUser || !(await bcrypt.compare(password,searchUser.password))){
        return next(new AppError('Invalid credentials',401));
    }
    sendToken(searchUser,200,res);
});

exports.protect = catchAsync(async(req,res,next)=>{
    // 1) Getting and checking if token present in header
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    else if(req.cookies.jwt){
        token = req.cookies.jwt;
    }
    else{
        return next(new AppError('You are not logged in. Please log in to get access',401));
    }

    // 2)Verify the JWT Token
    const decodedData = await promisify(jwt.verify)(token,process.env.JWT_SECRET);
    
    // 3)Check if user still exists or not
    const freshUser = await User.findById(decodedData.id);
    if(!freshUser){
        return next(new AppError('The token belonging to the user does not exists',401));
    }

    // 4)Check if password is changed by the user or not
    if(freshUser.passwordChangedAt){
        const chngdtimestamp = parseInt(freshUser.passwordChangedAt.getTime()/1000);
        if(decodedData.iat < chngdtimestamp){
            return next(new AppError('User recently changed password. Please Log in again'));
        }
    }
    req.user = freshUser;
    next();
})

exports.restrictTo = (...roles) =>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have the permission to perform this action',403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email});
    if(!user){
        return next(new AppError(`No user with email address ${req.body.email} found`,404));
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a patch request with your new password and passwordConfirm to ${resetURL}`;

    try{
        await sendEmail({
            email:user.email,
            subject:'Your password reset Token (Valid for only 10 mins)',
            message
        });
        res.status(200).json({
            status:'success',
            message: `Token sent to ${user.email}`
        })
    }
    catch(err){
        user.passwordResetToken = undefined;
        user.paswordResetTokenExpires = undefined;
        await user.save({validateBeforeSave:false});
        return next(new AppError('There was an error sending mail. Try again later',500));
    }
})

exports.resetPassword = catchAsync(async(req,res,next)=>{
    // 1)Get user based on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken:hashedToken,passwordResetTokenExpires:{$gt:Date.now()}});
    
    // 2) If user exists , then update password
    if(!user){
        return next(new AppError(`Either the token ${req.params.token} is invalid or the token has expired. Please try again`,400));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken=undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save();

    sendToken(user,200,res);
})

exports.updatePassword = catchAsync(async(req,res,next)=>{
    const user = await User.findById(req.user.id).select('+password');

    if(!user || !(await bcrypt.compare(req.user.currpassword,user.password))){
        return next(new AppError('Invalid Credentials',401));
    }
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
    sendToken(user,201,res);
})