const express=require('express');
const tourRouter=express.Router();
const {addTour,getTours,getSingleTour,UpdateTour,deleteTour,validTour,checkbody,aliasingTour,getTourStats,getmonthlyPlan, getToursWithinLocation,getAllToursFromCertainLocation, uploadTourImages, processTourImages, getTotalCounts}=require('../controllers/tourController');
const {verifyUser,restricTo}=require('../controllers/authController');
const reviewRouter=require('../routers/reviewrouter');

// nested router using express
// here we import a reviewRouter and mount that
tourRouter.use('/:tourId/review',reviewRouter)
tourRouter.param('id',validTour);
tourRouter.route('/count').get(getTotalCounts);
tourRouter.route('/tourStats').get(getTourStats);
tourRouter.route('/monthly-plan/:year').get(verifyUser,restricTo('admin','lead-guide','guide'),getmonthlyPlan)
tourRouter.route('/top-5-tours').get(aliasingTour,getTours);
// tourRouter.route('/tours-within/distance/:distance/center/:center/unit/:unit').get(getToursWithinLocation);
tourRouter.route('/distances/:distance/unit/:unit').get(getAllToursFromCertainLocation)
// tourRouter.route('/').post(checkbody,addTour).get(getTours);
tourRouter.route('/').post(verifyUser,restricTo('admin','lead-guide'),addTour).get(getTours);
tourRouter.route('/:id').get(verifyUser,getSingleTour).patch(verifyUser,restricTo('admin','lead-guide'),uploadTourImages,processTourImages,UpdateTour).delete(verifyUser,restricTo('admin','lead-guide'),deleteTour);

//nested route for reviews on tour
// tourRouter.route('/:tourId/review').post(verifyUser,restricTo('user'),createReview)
module.exports=tourRouter;
