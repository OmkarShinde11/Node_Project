const fs=require('fs');
const multer=require('multer');
const sharp=require('sharp');
const User=require('../Models/userModel');
const catchAsync=require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const { deleteOne, updateOne, getOne, getAll } = require('./factoryHandler');
let userdata=fs.readFileSync('./dev-data/data/users.json','utf-8');
userdata=JSON.parse(userdata);
let domainData=fs.readFileSync('./dev-data/data/domain.json','utf-8');
domainData=JSON.parse(domainData);
const getAllDomain=(req,res,next)=>{
    res.status(200).json({
        status:'success',
        results:domainData.length,
        data:domainData
    })
}
// when there is no image processing then use diskStorage

// const multerStorage=multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'public/img/users')  // here cb works as a next
//     },
//     filename:(req,file,cb)=>{
//         const ext=file.mimetype.split('/')[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// });

// when there is image processing then use memorystorage.
const multerStorage=multer.memoryStorage();

const multerFilter=(req,file,cb)=>{
    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }
    else{
        cb(new AppError('Piease Provide an image',400),false);
    }
}

const upload=multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

const uploaUserPhoto=upload.single('photo');

const imageProcess=catchAsync(async (req,res,next)=>{
    // if(!req.file) next();
    const ext=req.file.mimetype.split('/')[1];
    req.file.filename=`user-${req.user.id}-${Date.now()}.${ext}`;
    await sharp(req.file.buffer).
    resize(500,500).
    toFormat(ext).
    jpeg({quality:90}).
    toFile(`public/img/users/${req.file.filename}`);
    next();
});

const filterUserData=(body,...args)=>{
    let newObj={};
    args.forEach(el=>{
        if(body.hasOwnProperty(el)){
            newObj[el]=body[el];
        }
    })
    console.log(newObj);
    return newObj;
}

const checkObjectLength=(obj)=>{
    if(obj==null || obj==undefined) return false
    let arr=Object.keys(obj);
    if(arr && arr.length>0)return true;
    return false;
}

const updateMe=catchAsync(async(req,res,next)=>{
    console.log(req.body);
    console.log(req.file);
    //if there is like password and passwordConfirm in req body then create a error
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError('This route is for just updating a user a data.To update a password then use updatepassword route',400))
    }

    // here only update a non-sensetive data like name email

    //filter a data first
    let filterbody={};
    if(checkObjectLength(req.body)){
        filterbody=filterUserData(req.body,'name','email','role');
    }
    if(req.file){
        filterbody.photo=req.file.filename;
    }
    const newUser=await User.findByIdAndUpdate(req.user.id,filterbody,{
        new:true,
        runValidators:true
    })

    res.status(200).json({
        status:'success',
        data:{
            user:newUser,
        }
    })
});

// const getAllUser=catchAsync(async (req,res)=>{
//     let all_user=await User.find();
//     res.status(200).json({
//         status:'success',
//         results:all_user.length,
//         data:all_user,
//     })
// })

const getAllUser=getAll(User);


const createUser=(req,res)=>{
    let id=userdata.length;
    let newUser=Object.assign({_id:id},req.body);
    userdata.push(newUser);
    fs.writeFile('./dev-data/data/users.json',JSON.stringify(userdata),'utf-8',err=>{
        res.status(201).json({
            status:'success',
            data:newUser,
        })
    })
    res.status(201).json({
        status:'success',
        data:newUser
    })
};
const getSingleUSer=getOne(User);

const getMe=(req,res,next)=>{
    req.params.id=req.user.id;
    next();
}

// this is used for update use only for admin
const updateUser=updateOne(User);

const validUser=(req,res,next,val)=>{
    let checked=userdata.find(el=>el._id==val);
    if(!checked){
        console.log('Param middleware called for invalid id')
        return res.status(404).json({
            status:'fail',
            message:'Invalid id'
        })
    }
    console.log('param middleware called for valid user')
    next();
}

const deleteUser=catchAsync(async(req,res,next)=>{
    // here we not actually delete an user so here we just keep user property active:false.
    await User.findByIdAndUpdate(req.user.id,{
        active:false,
    });
    res.status(204).json({
        status:'sucess',
        message:'User deleted successfully.'
    })
})

// this is delete a user from database pemanatally, this route can be access by an admin only.
const deleteOnly=deleteOne(User);

module.exports={
    getAllUser,
    createUser,
    updateUser,
    deleteUser,
    getSingleUSer,
    validUser,
    getAllDomain,
    updateMe,
    deleteOnly,
    getMe,
    uploaUserPhoto,
    imageProcess
}