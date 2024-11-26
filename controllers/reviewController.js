const Review = require("../Models/reviews");
const catchAsync = require("../utilities/catchAsync");
const { deleteOne, updateOne, createDoc, getOne, getAll } = require("./factoryHandler");

// const getAllReview=catchAsync(async(req,res,next)=>{
//     let  filter={};
//     if(req.params.tourId) filter={tourRef:req.params.tourId};
//     const reviews=await Review.find(filter);
//     res.status(200).json({
//         status:'Success',
//         data:{
//             reviews
//         }
//     })
// });

const getAllReview=getAll(Review);

const setReviewData=(req,res,next)=>{
    if(!req.body.userRef) req.body.userRef=req.user.id;
    if(!req.body.tourRef)req.body.tourRef=req.params.tourId;
    next();
}

const createReview=createDoc(Review);
const getSingleReview=getOne(Review);
const deleteReview=deleteOne(Review);
const updateReview=updateOne(Review);

module.exports={
    getAllReview,
    createReview,
    deleteReview,
    updateReview,
    setReviewData,
    getSingleReview
}