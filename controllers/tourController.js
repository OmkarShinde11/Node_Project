const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');
const monggose = require('mongoose')
const Tour = require('../Models/tourModel');
const APIFeature = require('../utilities/apifeature');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const { deleteOne, updateOne, createDoc, getOne, getAll } = require('./factoryHandler');
let tourData = fs.readFileSync('./dev-data/data/tours-simple.json', 'utf-8');
tourData = JSON.parse(tourData);

// const addTour= (req,res)=>{
//     let data=req.body;
//     console.log(req.body);
//     if(data.hasOwnProperty('name') && data.hasOwnProperty('price')){
//         const newId=tourData[tourData.length-1].id+1;
//         const newTour=Object.assign({id:newId},req.body);
//         console.log(newTour);
//         tourData.push(newTour);
//         fs.writeFile('./dev-data/data/tours-simple.json',JSON.stringify(tourData),err=>{
//             res.status(201).json({
//                 status:'Success',
//                 data:{
//                     tour:newTour,
//                 }
//             })
//         }) 
//     }
//     else{
//         return res.status(404).json({
//             status:'fail',
//             message:'Invalid data'
//         })
//     }
// }

// const addTour= catchAsync(async (req,res,next)=>{
//     const newTour= await Tour.create(req.body);
//         res.status(201).json({
//             status:'success',
//             data:newTour,
//     })
// })

const addTour = createDoc(Tour);

// const getTours=(req,res)=>{
//     res.status(200);
//     res.json({
//         status:'Success',
//         requestedAt:req.requestAtTime,
//         results:tourData.length,
//         data:{
//             tourData
//         },
//     });
// }

const aliasingTour = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
}

// const getTours=catchAsync(async (req,res,next)=>{
//         const apiFeature=new APIFeature(Tour.find(),req.query).fliter().sort().selectFields().Pagination()
//         const allTourData=await apiFeature.query;
//         res.status(200).json({
//             status:'success',
//             results:allTourData.length,
//             data:allTourData,
//         })
// });

const getTours = getAll(Tour);

// const getSingleTour=(req,res)=>{
//     const id=req.params.id;
//     if(id>tourData.length){
//         return res.status(404).json({
//             status:'fail',
//             message:'request is failed invalid ID'
//         })
//     }
//         let singletourData=tourData.find(el=>el.id==id);
//         res.status(200).json({
//             status:'Success',
//             data:{
//                 tour:singletourData,
//             }
//         });

// }

// const getSingleTour=catchAsync(async(req,res,next)=>{
//         const validTour=await Tour.findById({_id:req.params.id}).populate('reviews');
//         if(!validTour){
//             return next(new AppError(`No Tour find with this ${req.params.id} id`,404));
//         }
//         res.status(200).json({
//             status:'success',
//             data:validTour,
//         })
// })

const getSingleTour = getOne(Tour, { path: 'reviews' });

// const UpdateTour=(req,res)=>{
//     const id=req.params.id;
//     tourData[id]=req.body;
//     res.status(200).json({
//         status:'Success',
//         message:'Tour Update Successfully'
//     })
// }

// const UpdateTour=catchAsync(async (req,res,next)=>{
//     // try{
//         const tour=await Tour.findByIdAndUpdate(req.params.id, req.body,{
//             new:true,
//             runValidators:true,
//         });
//         if(!tour){
//             return next(new AppError(`No Tour find with this ${req.params.id} id`,404));
//         }
//         res.status(201).json({
//             status:'success',
//             data:tour
//         })
// })

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
    console.log(file);
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    }
    else {
        cb(new AppError('Here only image is need to be upload', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
})

// Note: when we upload multiple images then it is req.files

const uploadTourImages = upload.fields(
    [
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 3 }
    ]
)

const processTourImages = catchAsync(async (req, res, next) => {
    console.log(req.body, req.files);
    const coverExt = req.files.imageCover[0].mimetype.split('/')[1];
    const coverFilename = `tours-${req.params.id}-${Date.now()}-cover.${coverExt}`;
    //1) processing an imageCover.
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat(coverExt)
        .toFile(`public/img/tours/${coverFilename}`);

    req.body.imageCover = coverFilename;

    //2) processing an images.
    req.body.images = [];
    await Promise.all(
        req.files.images.map(async (file, i) => {
            const ext = file.mimetype.split('/')[1];
            const fileName = `tours-${req.params.id}-${Date.now()}-${i + 1}.${ext}`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat(ext)
                .toFile(`public/img/tours/${fileName}`)

            req.body.images.push(fileName);
        })
    );
    next();
})

const UpdateTour = updateOne(Tour);

// const deleteTour=catchAsync(async(req,res,next)=>{
//     // try{
//         const tour=await Tour.findByIdAndDelete(req.params.id);
//         if(!tour){
//             return next(new AppError(`No Tour find with this ${req.params.id} id`,404));
//         }
//         res.status(204).json({
//             status:'success',
//             message:'Tour Deleted Successfully'
//         })
// })

const deleteTour = deleteOne(Tour);

// const validTour=(req,res,next,val)=>{
//     let checked=tourData.find(el=>el.id==val);
//     if(!checked){
//         console.log('Param middleware called for invalid id')
//         return res.status(404).json({
//             status:'fail',
//             message:'Invalid id'
//         })
//     }
//     console.log('Param middleware called for valid id')
//     next();
// }

const validTour = async (req, res, next, val) => {
    if (monggose.Types.ObjectId.isValid(val)) {
        next();
    }
    else {
        next(new AppError('Invalid id', 400))
    }
}

const getTourStats = catchAsync(async (req, res) => {
    // try{
    let statsData = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: '$difficulty',
                avgPrice: { $avg: '$price' },
                avgRating: { $avg: '$ratingsQuantity' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                numTours: { $sum: 1 },
            }
        },
        {
            $sort: { avgPrice: -1 }
        }
    ]);

    res.status(200).json({
        status: 'success',
        results: statsData.length,
        data: statsData,
    })
    // }
    // catch(err){
    //     res.status(400).json({
    //         status:'fail',
    //         message:err
    //     })
    // }
})

const getmonthlyPlan = catchAsync(async (req, res) => {
    // try{
    const year = req.params.year;
    console.log(year)
    const monthData = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                tourNames: { $push: '$name' },
                numTours: { $sum: 1 },
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: { numTours: -1 }
        }
    ]);
    res.status(200).json({
        status: 'success',
        results: monthData.length,
        data: monthData,
    })
    // }
    // catch(err){
    //     res.status(400).json({
    //         status:'fail',
    //         message:err
    //     })
    // }
})

// const checkbody=(req,res,next,body)=>{
//     let data=body;
//     console.log(body);
//     if(data.hasOwnProperty('name') && data.hasOwnProperty('price')){
//         next();
//     }
//     else{
//         return res.status(400).json({
//             status:'fail',
//             message:'Price and name must contain in data'
//         })
//     }

// }

// /tours-within/distance/:distance/center/:center/unit/:unit
const getToursWithinLocation = catchAsync(async (req, res, next) => {
    const { distance, center, unit } = req.params;
    const [lat, lng] = center.split(',');
    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
    console.log("radius", radius);
    if (!lng && !lat) {
        return next(new AppError('Please provide a distance', 400));
    }

    const tours = await Tour.find(
        { startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } }
    );
    res.status(200).json({
        status: 'Success',
        results: tours?.length,
        data: tours
    })
});

// {startLocation:{$geoWithin:{ $centerSphere: [ [ 34.111745, -118.113491 ], 0.10092854259184497 ]}}}
// {startLocation: {$geoWithin: { $centerSphere: [ [ -118.23201576048754, 34.06176136129718 ], 0.009548316209008671 ]}}}

const getAllToursFromCertainLocation = catchAsync(async (req, res, next) => {
    const { distance, unit } = req.params;
    const [lat, lng] = distance.split(',');
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;
    if (!lng && !lat) {
        return next(new AppError('Please provide a distance', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [lng * 1, lat * 1],
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier,
            }
        },
        {
            $project: {
                name: 1,
                distance: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'Success',
        data: distances
    })
});

const getTotalCounts = catchAsync(async (req, res, next) => {
    const count = await Tour.find({});
    console.log(count);
    res.status(200).json({
        status: 'Successss',
        total_Count: count.length,
    })
})

module.exports = {
    addTour,
    getTours,
    getSingleTour,
    UpdateTour,
    deleteTour,
    validTour,
    aliasingTour,
    getTourStats,
    getmonthlyPlan,
    getToursWithinLocation,
    getAllToursFromCertainLocation,
    processTourImages,
    uploadTourImages,
    getTotalCounts
    // checkbody,
}