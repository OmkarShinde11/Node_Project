const express=require('express');
const { verifyUser, restricTo } = require('../controllers/authController');
const { getAllReview, createReview, deleteReview, updateReview,setReviewData, getSingleReview } = require('../controllers/reviewController');
const reviewRouter=express.Router({ mergeParams:true });

reviewRouter.use(verifyUser);
reviewRouter.get('/getReview',getAllReview);
reviewRouter.post('/createReview',restricTo('user'),setReviewData,createReview);
reviewRouter.delete('/:id',restricTo('admin','user'),deleteReview);
reviewRouter.patch('/:id',restricTo('admin','user'),updateReview);
reviewRouter.get('/:id',getSingleReview);

module.exports=reviewRouter