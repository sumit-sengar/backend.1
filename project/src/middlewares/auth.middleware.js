import {User} from "../models/user.model.js"
import { ApiError } from "../utils/api-error.js"
import { asyncHandler } from "../utils/async-handler.js"
import jwt from "jsonwebtoken";

export const verifyJWT=asyncHandler(async(req,res,next)=>{
    const token=req.cookies?.accessToken
    
    if(!token)
    {
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken -firstName -lastName");

        if(!user)
        {
            throw new ApiError(401,"invalid access token")
        }
        req.user=user;
        next()

    }
    catch (error) {
        throw new ApiError(401,"invalid access token")
    }
});

export const authorizeRole=(...allowedRoles)=>{
    return(req,res,next)=>{
        if(!req.user)
        {
            throw new ApiError(401,"User is not authenticated");
        }

        if(!allowedRoles.includes(req.user.role))
        {
            throw new ApiError(403,"Access denied: insufficient role privileges");
        }
        next();
    };
};