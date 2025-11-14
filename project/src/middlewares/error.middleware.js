import { ApiError } from "../utils/api-error.js";

export const errorHandler=(err,req,res,next)=>{
    console.error(err);

    if(err instanceof ApiError)
    {
        return res.status(err.statusCode).json({
            success:false,
            message:err.message,
            errors:err.errors,
            data:err.data,
        });
    }
    return res.status(500).json({
        success:false,
        message:"Internal Server Error",
        errors:[err.message],
    });
};

