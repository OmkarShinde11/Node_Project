const express=require('express');
const {getAllUser,createUser, updateUser,deleteUser,getSingleUSer,validUser,getAllDomain,updateMe, deleteOnly, getMe, uploaUserPhoto, imageProcess}=require('../controllers/userController');
const {signUpUser,loginUser,forgotPassword,resetPassword,updatePassword,verifyUser, restricTo,}=require('../controllers/authController');
// const fs=require('fs');

// let userdata=fs.readFileSync('./dev-data/data/users.json','utf-8');
// userdata=JSON.parse(userdata);
const userRouter=express.Router();


userRouter.post('/SignUp',signUpUser);
userRouter.post('/login',loginUser);
userRouter.post('/forgotPassword',forgotPassword);
userRouter.patch('/resetPassword/:token',resetPassword)

//here i use a middleware so verifyuser is called before this all routes.
userRouter.use(verifyUser)

userRouter.patch('/updatePassword',updatePassword);
userRouter.patch('/updateMe',uploaUserPhoto,imageProcess,updateMe);
userRouter.delete('/deleteUser',deleteUser)//this is soft delete
// userRouter.get('/domain-list',getAllDomain);
userRouter.get('/getMe',getMe,getSingleUSer);
userRouter.param('id',(req,res,next,val)=>{
    console.log('Param middleware is called',val);
    next()
});

// here i use a middleware so restrictTo() is called before this route.
userRouter.use(restricTo('admin'));


// userRouter.param('id',validUser)
userRouter.route('/').get(getAllUser);
userRouter.route('/:id').get(getSingleUSer).patch(updateUser).delete(deleteOnly);
// here the updateUser is used only for administration
// here this delete is delete user permanatally.
module.exports=userRouter;