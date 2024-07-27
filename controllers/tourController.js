const AppError = require('../utils/appError.js');
const Tour = require('./../models/tourModel.js');
const APIFeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsyncError.js');

exports.aliasTours = (req,res,next) =>{
    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage';
    req.query.fields = 'name,price,ratingsAverage,duration';
    next();
}

exports.getTourStats = catchAsync(async (req,res,next)=>{
    const stats = await Tour.aggregate([
        {
            $match:{ratingAverage:{$gte:4.5}}
        },
        {
            $group:{
                _id:'$difficulty',
                tourCount:{ $sum : 1},
                ratingCount : {$sum : '$ratingsCount'},
                ratingAvg : {$avg : '$ratingAverage'},
                priceAvg : {$avg : '$price'},
                minPrice : {$min : '$price'},
                maxPrice : {$max : '$price'}
            }
        }
    ]);
    res.status(200).json({
        status:'success',
        data:{
            stats
        }
    });
});

exports.getAllTours = catchAsync(async(req,res,next) =>{
        const features = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
        const allTours = await features.query;

        res.status(200).json({
            status:'success',
            result:allTours.length,
            tours:allTours
        });
});

exports.getTour = catchAsync(async(req,res,next)=>{
        const currTour = await Tour.findById(req.params.id).populate('reviews');
        res.status(200).json({
            status:'success',
            tour:currTour
        })
})

exports.createTour = catchAsync(async(req,res,next)=>{
        const newTour = await Tour.create(req.body);
        res.status(200).json({
            status:'success',
            requestedAt: req.requestTime,
            data:{
                tour:newTour
            }
        })
})

exports.updateTour = catchAsync(async(req,res,next)=>{
        const updatedTour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
            new:true,
            runValidators:true
        });
        res.status(200).json({
            status:'Success',
            updated_data:updatedTour
        })
})

exports.deleteTour = catchAsync(async(req,res)=>{
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status:'success',
            data:'Data deleted successfully'
        })
})

exports.getToursWithin = catchAsync(async(req,res,next)=>{
    const {distance,latlng,unit} = req.params;
    const [lat,lng] = latlng.split(',');
    const radius =  unit==='mi' ? distance/3963.2 : distance/6378.1;

    if(!lat || !lng){
        return next(new AppError('No latitute longitude mentioned',404));
    }
    const filteredTours = await Tour.find({
        startLocation: {$geoWithin : {$centerSphere : [[lng,lat],radius]}}
    });
    res.status(200).json({
        status:'success',
        toursWithin:filteredTours
    });
});