const mongoose=require('mongoose');
// const User=require('../Models/userModel');

// Create a Schema
const tourSchema=new mongoose.Schema({
    name:{
        type:String,
        unique:true,
        required:[true,'A tour must have a name'],
        trim: true,
        maxlength:[40,'A tour name must have less or equal than 40 characters'],
        minlength:[10,'A tour name must have more or equal than 10 characters'],
    },
    duration:{
        type:Number,
        required:[true,'A tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true,'A tour must have a maxGroupSize'],
    },
    difficulty:{
        type:String,
        required:[true,'A tour must have a difficulty'],
        enum:['easy','medium','difficult'],
    },
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:[1,'Rating must be above 1'],
        max:[5,'Rating must be below 5'],
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },
    rating:{
        type:Number,
        default:4.5
    },
    priceDiscount:{
        type:Number,
        validate:{
            validator:function(val){
                return val<this.price;
            },
            message:'Discount Price ({VALUE}) value is below than regular price'
        }
    },
    summary:{
        type:String,
        trim:true,
        required:[true,'A tour must have a summary']
    },
    description:{
        type:String,
        trim:true,
    },
    imageCover:{
        type:String,
        required:[true,'A tour must have a image']
    },
    images:[String],
    createdAt:{
        type:Date,
        default:Date.now(),
        select:false,
    },
    startDates:[Date],
    price:{
        type:Number,
        required:[true,'A tour must have a price'],
    },
    secretTour:{
        type:Boolean,
        default:false,
    },
    startLocation:{
        type:{
            type:String,
            default:'Point',
            enum:['Point'],
            required:[true,'A tour must have location co-ordinate type']
        },
        coordinates:{
            type:[Number],
            required:[true,'A tour must have location co-ordinate'],
        },
        address:{
            type:String,
            required:[true,'A tour must have a address'],
        }
    },
    locations:[
        {
            type:{
                type:String,
                default:'Point',
                enum:['Point']
            },
            coordinates:[Number],
            address:String,
            day:Number,
        }
    ],

    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User',
        }
    ]

},
{
    toJSON:{virtuals:true},
    toObject:{virtuals:true},
})

// add an index
// tourSchema.index({price:1}) // normal index
// compound index where we create two index so in search query if there is one key so this compound works for that one also
tourSchema.index({price:1,ratingsAverage:-1})
tourSchema.index({startLocation:'2dsphere'});

//set a virtual properties.
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
})
// set a virtual populate to get a review from review collection
tourSchema.virtual('reviews',{
    ref:'Review',
    foreignField:'tourRef',
    localField:'_id'
})

//use a document middleware.
// save middleware works on only .save and .create();
tourSchema.pre('save',function(next){
    console.log('Document middleware called...');
    next();
})
// this is we add user by embaddinbg document.
// tourSchema.pre('save',async function(next){
//     const guidesPromise=this.guides.map(async id=>await User.findById(id));
//     this.guides=await Promise.all(guidesPromise);
//     next();
// })
// this middleware called after the saving or creating a document.
tourSchema.post('save',function(docs,next){
    console.log('docs');
    next();
})

//use an query middleware.
//This is called on query which start with find
tourSchema.pre(/^find/,function(next){
    this.find({secretTour:{$ne:true}});
    this.start=Date.now();
    next();
});

tourSchema.pre(/^find/,function(next){
    this.populate({
        path:'guides',
        select:'-__v'
    });
    next();
})

tourSchema.post(/^find/,function(docs,next){
    console.log(`Time required to complete a request is: ${Date.now()-this.start} miliseconds.`)
    next();
    // console.log(docs);
})

//use an aggregate middleware

// tourSchema.pre('aggregate',function(next){
//     console.log('aggregate middleware called.')
//     this.pipeline().unshift({$match:{secretTour:{$ne:true}}});
//     next();
// })
//create a model
const Tour=new mongoose.model('Tour',tourSchema);

module.exports=Tour;