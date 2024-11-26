const User =require('../Models/userModel');
const jwt=require('jsonwebtoken');
const catchAsync=require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
// const sendEmail=require('../utilities/email');
const Email=require('../utilities/email');

const crypto = require('crypto');
const createCookie={
    expires:new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES * 60 * 60 * 1000),
    httpOnly:true
}
const generateToken= (id)=>{
    console.log(process.env.EXPIRES);
    return jwt.sign({id:id},process.env.AUTH_SECRET_KEY,{expiresIn:process.env.EXPIRES});
}
const createSendToken=(user,statusCode,res)=>{
    const token=generateToken(user.id);
    if(process.env.NODE_ENV=='production')createCookie.status=true;
    res.cookie('jwt',token,createCookie);

    this.password=undefined  // remove password from output
    res.status(statusCode).json({
        status:'success',
        token:token,
        expiresIn:process.env.JWT_COOKIE_EXPIRES * 60 * 60 * 1000,
        data:{
            user
        }
    })
}
const signUpUser=catchAsync(async (req,res,next)=>{
    // const newUser=await User.create({
    //     name:req.body.name,
    //     email:req.body.email,
    //     password:req.body.password,
    //     passwordConfirm:req.body.passwordConfirm,
    //     passwordChangedAt:req.body.passwordChangedAt,
    // });

    const newUser=await User.create(req.body);

    // create a jwt token
    // const token=await jwt.sign({id:newUser._id},process.env.AUTH_SECRET_KEY,{expiresIn:process.env.EXPIRES});
    createSendToken(newUser,201,res)
    // const token=generateToken(newUser._id);
    // res.status(201).json({
    //     status:'success',
    //     data:{
    //         user:newUser,
    //         token:token,
    //     }
    // })
});

const loginUser=catchAsync (async (req,res,next)=>{
    // check email and password is enter by an user;
    const {userEmail,password}=req.body;
    console.log(userEmail,password);
    if(!userEmail || !password){
        return next(new AppError('please provide email and password',400));
    }
    //check user is there in db or not
    const user=await User.findOne({email:userEmail}).select('+password'); //here in model we declare select:false to password field so to get that we use .select('field-name)
    if(!user) return next(new AppError('Incorrect email',401));

    //check the password which user enters and in db is same or not
    const correctPassword=await user.correctPassword(password,user.password);
    if(!correctPassword) return next(new AppError('Invalid Password',401));
    console.log(user,correctPassword);
    // generate a token
    createSendToken(user,201,res);
    // const token=generateToken(user._id);
    // res.status(200).json({
    //     status:'success',
    //     token:token,
    // })
});

const verifyUser=catchAsync(async(req,res,next)=>{
//getting a token
    const {authorization}=req.headers;
    let token=authorization?.split(' ')[1];
    if(!token){
        return next(new AppError("Token not provided , Authentication failed !!!", 400));
    }

    //verify a token 
    let decoded=await jwt.verify(token,process.env.AUTH_SECRET_KEY);
    console.log(decoded);

    //check the user exist
    let currentUser=await User.findById(decoded.id);
    if(!currentUser){
        return next(new AppError('User Not Found',401));
    }
    // check if user changed the password after token was issued.
    if(currentUser.checkPasswordAfter(decoded.iat)){
        return next(new AppError('Use recently changed a password! please log in again',401));
    }
    req.user=currentUser;
    next();
})

const restricTo=(...args)=>{
    return (req,res,next)=>{
        if(!args.includes(req.user.role)) return next(new AppError('You do not have permission to peform this task.',403));
        next();
    }
}

const forgotPassword=catchAsync(async (req,res,next)=>{
    // get a user based on email
    const user=await User.findOne({email:req.body.email});
    if(!user){
        return next(new AppError('User not fount',404));
    }
    //generate random token
    const resetToken=user.createPasswordToken();
    console.log('resetToken',resetToken);
    await user.save({ validateBeforeSave: false })
    //send a email

    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    console.log(resetURL);

    const message=`To forgot a password click on below link\n ${resetURL}\n if you didn't then ignore this mail`;

    //this try catch is just for the sendemail purpose because in case of fail i want to reset a field 
    try{
        // await sendEmail({
        //     email:user.email,
        //     subject:'Forgot Password (valid till 10 minutes)',
        //     message
        // })

        await new Email(user,resetURL).sendPasswordResetTokenEmail();
    
        res.status(200).json({
            status:'success',
            message:'Token send to an email'
        })
    }
    catch(err){
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined;
        await user.save({ validateBeforeSave: false });
        // return next(new AppError('There was an error while sending an email'),500);
        return res.status(500).json({
            status:'fail',
            message:err.message,
        })

    }
})

const resetPassword=catchAsync(async(req,res,next)=>{
    //get a user base on token
    // check if password is expired or not if its not then set a new password for that
    const encToken=crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user=await User.findOne({passwordResetToken:encToken,passwordExpiresIn:{$gt:Date.now()}});
    console.log(user);
    if(!user){
       return next(new AppError('User not found',404));
    }
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordExpiresIn=undefined;
    user.save();
    // log in the user;
    createSendToken(user,201,res);
    // const token=generateToken(user.id);
    // res.status(200).json({
    //     status:'success',
    //     token:token,
    // })

})

// update a password
const updatePassword=catchAsync(async(req,res,next)=>{
    // get a user from an collection
    const user =await User.findById(req.user.id).select('+password');
    // check a current password is correct;
    const correctPassword=await user.correctPassword(req.body.currentPassword,user.password)
    if(!correctPassword){
        return next(new AppError('Your current password is wrong',401));
    }
    // If so then we update a password
    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    await user.save();
    //log user in send jwt 
    createSendToken(user,200,res);
});

module.exports={
    signUpUser,
    loginUser,
    verifyUser,
    restricTo,
    forgotPassword,
    resetPassword,
    updatePassword
}