const express=require('express');
const dotenv=require('dotenv');
const mongoose=require('mongoose');
const APPError=require('./utilities/appError');
dotenv.config({path:'./config.env'})
const app=express();
const morgan=require('morgan');
const tourRouter=require('./routers/tourrouter');
const userRouter=require('./routers/userrouter');
const bookingRouter=require('./routers/bookingRouter');
const globalErrorHandler=require('./controllers/errorController');
const cors = require('cors');
const limit=require('express-rate-limit');
const helmet=require('helmet');
const xss=require('xss-clean');
const sanitize=require('express-mongo-sanitize');
const hpp=require('hpp');
const reviewRouter = require('./routers/reviewrouter');
// const hpp = require('hpp');
const limiter=limit({
    max:100,
    windowMS:60 * 60 *1000,
    message:'Too many request.please try again in an hour'
});
//rate-limit
app.use('/api',limiter);
app.use(helmet());
app.use(cors());
process.on('uncaughtException',(err)=>{
    console.log(err.name,err.message);
    console.log('Unhandle Rejection occured');
    process.exit(1);   // process.exit close all the request which are running and pending so in is inside server.close so server.close it take a time to close the server and request.
})
if(process.env.NODE_ENV=='development'){

    app.use(morgan('dev'));
}
//
app.use(express.json({limit:'10kb'}));
// Data Sanitization against NoSQL query injection
app.use(sanitize());
// Data Sanitization against XSS
app.use(xss());
//using duplicate parameter in req.query so it is 
app.use(hpp({
    whitelist:['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price'],
}));
app.use(express.static('./public',))
app.use((req,res,next)=>{
    req.requestAtTime=new Date().toISOString();
    next();
});
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/review',reviewRouter);
app.use('/api/v1/booking',bookingRouter);

// This middleware is after the route mounting because if wrong url is requested (which not define in route) so in router it will not get that route so it comes out from router and the below middleware is executed.
app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status:'fail',
    //     message:`Can't find this ${req.originalUrl} on this server.`,
    // })

    // const err=new Error(`Can't find this ${req.originalUrl} on this server.`);
    // err.statusCode=404y
    // console.log(err.message);
    const err= new APPError(`Can't find this ${req.originalUrl} on this server.`,404);
    next(err);
});
app.use(globalErrorHandler);
const db=process.env.DATABASE_URI;
console.log(db)
mongoose.connect(db,{
    useNewUrlParser:true,useCreateIndex:true,useFindAndModify:false
}).then(con=>{
    // console.log(con);
    console.log('Connection Successfully');
})

const server=app.listen('9000',()=>{
    console.log('Port is listening on 9000');
});

process.on('unhandledRejection',(err)=>{
    console.log(err)
    console.log('Unhandle Rejection occured');
    server.close(()=>{
        process.exit(1);   // process.exit close all the request which are running and pending so in is inside server.close so server.close it take a time to close the server and request.
    })
})


