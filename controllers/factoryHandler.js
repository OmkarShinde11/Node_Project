const catchAsync=require('../utilities/catchAsync');
const AppError=require('../utilities/appError');
const APIFeature=require('../utilities/apifeature');

const deleteOne= Model=>(
    catchAsync(async(req,res,next)=>{
            const doc=await Model.findByIdAndDelete(req.params.id);
            if(!doc){
                return next(new AppError(`No doc find with this ${req.params.id} id`,404));
            }
            res.status(204).json({
                status:'success',
                message:'doc Deleted Successfully'
            })
    })
);

const updateOne=Model=>(
    catchAsync(async (req,res,next)=>{
            const doc=await Model.findByIdAndUpdate(req.params.id, req.body,{
                new:true,
                runValidators:true,
            });
            if(!doc){
                return next(new AppError(`No doc find with this ${req.params.id} id`,404));
            }
            res.status(201).json({
                status:'success',
                data:doc
            })
    })
)

const createDoc=Model=>(
    catchAsync(async (req,res,next)=>{
            const newDoc= await Model.create(req.body);
                res.status(201).json({
                    status:'success',
                    data:newDoc,
            })
        })
)

const getOne=(Model,PopulateOptions)=>(
    catchAsync(async(req,res,next)=>{
        let query=Model.findById({_id:req.params.id})
        if(PopulateOptions) query=Model.findById({_id:req.params.id}).populate(PopulateOptions);
        const doc=await query;
        if(!doc){
            return next(new AppError(`No Tour find with this ${req.params.id} id`,404));
        }
        res.status(200).json({
            status:'success',
            data:doc,
        })
})
)
const getAll= Model=>(
    catchAsync(async(req,res,next)=>{
        let filter={};
        if(req.params.tourId) filter={tourRef:req.params.tourId};
        const apiFeature=new APIFeature(Model.find(filter),req.query).fliter().sort().selectFields().Pagination()
        const doc=await apiFeature.query;
        res.status(200).json({
            status:'success',
            page_size:Number(req.query.limit),
            page_number:Number(req.query.page),
            results:doc.length,
            data:doc,
        })
    })
)
module.exports={
    deleteOne,
    updateOne,
    createDoc,
    getOne,
    getAll
}
