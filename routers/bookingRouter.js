const express=require('express');
const { verifyUser } = require('../controllers/authController');
const { getCheckoutSession } = require('../controllers/bookingController');
const bookingRouter=express.Router();

bookingRouter.route('/checkout/:tourId').get(verifyUser,getCheckoutSession)

module.exports=bookingRouter;