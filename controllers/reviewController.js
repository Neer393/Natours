const Review = require('./../models/reviewModel.js');
const catchAsync = require('../utils/catchAsyncError.js');

exports.getAllReviews = catchAsync(async(req,res,next)=>{
    let filterobj={};
    if(req.params.tourId)   filterobj = {tour:req.params.tourId};
    const allreviews = await Review.find(filterobj);
    res.status(200).json({
        status:'success',
        reviewsCount : allreviews.length,
        allreviews
    });
});

exports.createReview = catchAsync(async(req,res,next)=>{
    if(!req.body.tour)  req.body.tour = req.params.tourId;
    if(!req.body.user)  req.body.user = req.user.id;
    const newreview = await Review.create(req.body);
    res.status(201).json({
        status:'success',
        newReview:newreview
    });
});