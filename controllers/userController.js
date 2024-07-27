const User = require('./../models/userModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');
const AppError = require('./../utils/appError.js');
const catchAsync = require('./../utils/catchAsyncError.js');

exports.getAllUsers = catchAsync(async(req,res,next)=>{
    const features = new APIFeatures(User.find(),req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const allUsers = await features.query;
    res.status(200).json({
        status:'success',
        usersCount:allUsers.length,
        users:allUsers
    })
})

exports.createUser = catchAsync(async(req,res,next)=>{
    const newuser = await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        confirmPassword:req.body.confirmPassword
    });
    res.status(200).json({
        status:'success',
        newuser:newuser
    })
})

exports.getUser = catchAsync(async(req,res,next)=>{
    const searchUser = await User.findById(req.params.id);
    res.status(200).json({
        status:'success',
        searchedUser:searchUser
    });
})

exports.updateUser = catchAsync(async(req,res,next)=>{
    if(req.body.password || req.body.confirmPassword){
        return next(new AppError('This route is not for password update',400));
    }
    // req.body is not a good method as user can modify the role to admin but ok for now
    const updatedUser = await User.findByIdAndUpdate(req.user.id,req.body,{ 
        new:true,
        runValidators:true
    });
    res.status(200).json({
        status:'success',
        newDetails:updatedUser
    })
})

exports.deleteUser = catchAsync(async(req,res,next)=>{
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({
        status:'success',
        message:'User deleted successfully'
    });
});