const AppError = require("../utilities/appError");

const sendProdError=(err,res)=>{
    if(err.isOperational){
        res.status(err.statusCode).json({
            status:err.status,
            message:err.message
        })
    }
    else{
        res.status(500).json({
            status:'error',
            message:'Something went wrong',
        })
    }
}



module.exports=(err,req,res,next)=>{
    console.log(err.statusCode,err.status,err.message,err.isOptional);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if(process.env.NODE_ENV === 'development'){
         res.status(err.statusCode).json({
            status:err.status,
            message:err.message,
            errro:err,
            stack:err.stack,
        })
    }
    else if(process.env.NODE_ENV === 'production'){
        
        if(err.code===11000){
            err=new AppError(`${Object.values(err.keyValue)[0]} is already created.`,400);
        }
        else if(err.name=='ValidationError'){
            // for(let str in err.errors){
            //     errMsg+=err.errors[str].message+'. ';
            // }
            // console.log('errMsg',errMsg);
            // err=new AppError(errMsg,400);

            // Object.values() give an array then we do map on that array then join the array to get a string
            let error=Object.values(err.errors).map(el=>el.message);   
            error=error.join('.');
            console.log('error',error);
            err=new AppError(error,400);
        }
        else if(err.name=='JsonWebTokenError'){
            err=new AppError('Invalid Token. Please log in again',401);
        }
        else if(err.name=='TokenExpiredError'){
            err=new AppError('Token is expired. please log in again',401);
        }
        sendProdError(err,res);
    }
}