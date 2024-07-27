const express = require('express');
const path =require('path');
const tourRouter = require('./routes/tourRoutes');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const reviewRouter = require('./routes/reviewRoutes');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController.js');

// Start express app
const app = express();

app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));

const limiter = rateLimit({
    max:100,
    windowMs:60*60*1000,
    message:'Too many requests from this IP Address. Please try agai in an hour!!!'
})
app.use('/api',limiter);
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json());
app.use(cookieParser());

// 3) ROUTES
app.get('/',(req,res)=>{
    res.status(200).render('base');
})

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews',reviewRouter);
app.all('*',(req,res,next)=>{
    next(new AppError(`Can't find ${req.originalUrl} on the server !!!`,404));
});
app.use(globalErrorHandler);

module.exports=app;