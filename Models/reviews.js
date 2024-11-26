const mongoose=require('mongoose');
const Tour = require('./tourModel');
const reviewsSchema=new mongoose.Schema({
    review:{
        type:String,
        required:[true,'A review must be there'],
        minlength:[10,'A minimum 10 characters are required']
    },
     rating:{
        type:Number,
        required:[true],
        min:[1,'Rating must be above 1'],
        max:[5,'Rating must be below 5'],
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    tourRef:{
            type:mongoose.Schema.ObjectId,
            ref:'Tour',
            required:[true,'Review must be belong to a tour'],
        },
    
    userRef:{
            type:mongoose.Schema.ObjectId,
            ref:'User',
            required:[true,'Review must be belong to a user'],
        },
    
},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
});

// this is compound index which will validate that on each tour the user will add only one review for specific tour.
reviewsSchema.index({tourRef:1,userRef:1},{unique:true});

reviewsSchema.pre(/^find/,function(next){
    // this.populate({
    //     path:'userRef',
    //     select:'name'
    // }).populate({
    //     path:'tourRef',
    //     select:'name'
    // })
    this.populate({
        path:'userRef',
        select:'name'
    });
    next();
});

reviewsSchema.statics.calcStatc=async function(tourId){
    //here we get a tourid
    console.log('tourID',tourId);
    // do aggregation an get averageRating and numRating,
    const stats=await this.aggregate([
        {
            $match:{tourRef:tourId}
        },
        {
            $group:{
                _id:'$tourRef',
                numRating:{$sum:1}, 
                avgRating:{$avg:'$rating'},
            }
        }
    ]);
    console.log('stats',stats);
    // update in tour document.
    if(stats && stats.length>0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsAverage:stats[0]?.avgRating,
            ratingsQuantity:stats[0]?.numRating,
        });
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsAverage:4.5,
            ratingsQuantity:0,
        })
    }
};

// this is when we create a review.
reviewsSchema.post('save',function(){
    // here we called a static method on Model but model deceleration is belowed that but instead of modelname we use this.constructor this is reffered to current document and in that document we have a constructor which reffered to a model.
    this.constructor.calcStatc(this.tourRef);
})

// this is when we update or delete a review.

reviewsSchema.pre(/^findOneAnd/,async function(next){
    //here we get a tour for that review but not an updated review data
    this.r=await this.findOne();
    next();
});

reviewsSchema.post(/^findOneAnd/,function(){
    // after data is save in database then we call the static function to calculate avgratings.
    this.r.constructor.calcStatc(this.r.tourRef);
})


const Review=new mongoose.model('Review',reviewsSchema);
module.exports=Review;