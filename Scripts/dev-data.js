const mongoose=require('mongoose');
const fs=require('fs');
const dotenv=require('dotenv');
dotenv.config({path:'./config.env'});

const db=process.env.DATABASE_URI;
const Tour=require('../Models/tourModel');
const User=require('../Models/userModel');
const Review=require('../Models/reviews');
// reading file
const tourData=JSON.parse(fs.readFileSync('./dev-data/data/tours.json','utf-8'));
const userData=JSON.parse(fs.readFileSync('./dev-data/data/users.json','utf-8'));
const reviewData=JSON.parse(fs.readFileSync('./dev-data/data/reviews.json','utf-8'));

// console.log(tourData);

mongoose.connect(db,{
    useNewUrlParser:true,useCreateIndex:true,useFindAndModify:false
}).then(con=>{
    console.log('connection successfully');
});

// insert a data
const insertData=async()=>{
    try{
        await Tour.create(tourData);
        // await User.create(userData, { validateBeforeSave:false});
        // await Review.create(reviewData);
        console.log('data insert successfully');
    }
    catch(err){
        console.log(err);
    }
}

//delete a data
const deleteData=async ()=>{
    try{
        await Tour.deleteMany();
        // await User.deleteMany();
        // await Review.deleteMany();
        console.log('data deleted successfully');
    }
    catch(err){
        console.log(err);
    }
}

if(process.argv[2]=='--import'){
    insertData();
}
else if(process.argv[2]=='--delete'){
    deleteData();
}
console.log(process.argv);
