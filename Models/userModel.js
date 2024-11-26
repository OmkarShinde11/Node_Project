const mongoose=require('mongoose');
const validator=require('validator');
const bcrypt=require('bcryptjs');
const crypto=require('crypto')
const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Name is required']
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:true,
        lowercase:true,
        // validate:{
        //     validator:function(value){
        //         const emailRegex=/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        //         return emailRegex.test(value);
        //     },
        //     message:`${value} is not valid.`
        // },
        validate:[validator.isEmail,'Email is not valid']
    },
    photo:{
        type:String,
        default:'default.jpg'
        // required:[true,'photo is required']
    },
    role:{
        type:String,
        enum:['user','guide','admin','lead-guide'],
        default:'user',
    },
    password:{
        type:String,
        required:[true,'Password is required'],
        minlength:8,
        select:false,
    },
    passwordConfirm:{
        type:String,
        required:[true,'Confirmation is required'],
        validate:{
            validator:function(value){
                return value===this.password;
            }
        }
    },
    passwordChangedAt:{
       type:Date,
    },
    passwordResetToken:{
        type:String,
    },
    passwordExpiresIn:{
        type:Date,
    },
    active:{
        type:Boolean,
        default:true,
        select:false
    }
})
// Note  in middleware we can't use arrow function because if we use arrow function we cant use this.
userSchema.pre('save',async function(next){
    if(!this.isModified('password'))return next();  //here isModified is an existing property on every field in mongoose

    this.password=await bcrypt.hash(this.password,12);
    // delete this.passwordConfirm; 
    // we can delete field but this in database so we usually assign undefined to it.
    this.passwordConfirm=undefined;
    next();
});

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew) return next();
    this.passwordChangedAt=Date.now();
    next();
});

userSchema.pre(/^find/,function(next){
    //here we add query middleware to find only thoose documents which have active:true; because it's helps to validate an user also. if we delete an user then we acess any route then we check the user is there are not so using this query then deactive user is not comes in a list so we not get a user.
    this.find({active:{$ne:false}});
    next();
})

userSchema.methods.correctPassword=async function(userEnterPassword,dbPassword){
    const comparePassword=await bcrypt.compare(userEnterPassword,dbPassword);
    return comparePassword
}

userSchema.methods.checkPasswordAfter=function(jwtTimestamp){
    if(this.passwordChangedAt){
        const changedPassword=parseInt(this.passwordChangedAt.getTime()/1000);
        console.log(changedPassword,jwtTimestamp);
        return changedPassword > jwtTimestamp;
    }
    return false;
}

userSchema.methods.createPasswordToken=function(){
    //create a reset token
    const resetToken=crypto.randomBytes(32).toString('hex');

    //encrypt that an save in db
    this.passwordResetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordExpiresIn=Date.now() + 10 * 60 * 1000; //here we add 10 minutes to reset a password // after 10 minutes the reset toekn is not valid.

    //return an unencrypted token
    return resetToken;


}

const userModel=new mongoose.model('User',userSchema);

module.exports=userModel;