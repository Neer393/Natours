const mongoose = require('mongoose');

const TourSchema = new mongoose.Schema({
    name:{
        type : String,
        required : [true,'A tour must have a name'],
        unique : [true,'A tour name must be unique'],
        trim:true
    },
    duration:{
        type:Number,
        required:[true,'A Tour must have a definite duration'],
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A Tour must have a maximum group size']
    },
    difficulty:{
        type:String,
        required:[true,'A Tour must define a difficulty level']
    },
    price:{
        type:Number,
        required:true
    },
    priceDiscount:Number,
    summary:{
        type:String,
        trim:true,
        required:[true,'A Tour requires summary']
    },
    ratingAverage:{
        type:Number,
        default:4.5,
        min:[1,'Rating must be above 1.0'],
        max:[5,'Rating must be below 5.0'],
        set: val => Math.round(val * 10)/10
    },
    ratingsCount:{
        type:Number,
        default:0
    },
    secretTour:{
        type:Boolean,
        default:false
    },
    description:{
        type:String,
        trim:true
    },
    coverImg:{
        type:String,
        required:[true,'A Tour requires a cover image']
    },
    images:[String],
    createdAt:{
        type: Date,
        default: Date.now()
    },
    startDates: [Date],
    startLocation:{
        type:{
            type:String,
            default:'Point',
            enum:['Point']
        },
        coordinates:[Number],
        address:String,
        description:String
    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            description:String,
            day:Number
        }
    ],
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]
},
{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});

TourSchema.index({price:1,ratingAverage:-1});
TourSchema.index({startLocation:'2dsphere'});

//Data defined using virtual are actually not saved to the database but are available on access
TourSchema.virtual('durationWeeks').get(function(){
    return this.duration/7;
});

TourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tour',
    localField:'_id'
});

//Document Middleware   //Can be used for authenticating before creating,updating or deleting data from DB
// TourSchema.pre('save',function(next){
//     console.log('Before saving...');
//     next();
// });

// TourSchema.post('save',function(next){
//     console.log('After Saving...');
//     next();
// });

//QUERY Middleware  //Can be used for checking query before passing the query to the DB
// TourSchema.pre(/^find/,function(next){
//     this.find({secretTour:{$ne : true}});
//     next();
// })

TourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select: '-v -passwordChangedAt'
    })
    next();
});

const Tour = mongoose.model('Tour',TourSchema);

module.exports = Tour;