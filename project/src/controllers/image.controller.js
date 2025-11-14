import {Image} from "../models/image.model.js"
import { ApiError } from "../utils/api-error.js"
import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js"
import fs from "fs"
import path from "path"

const uploadImage=asyncHandler(async(req,res)=>{
    if(!req.file)
    {
        throw new ApiError(400,"No image file uplaoded")
    }

    const image=await Image.create(
        {
            fileName:req.file.filename,
            filePath:req.file.path,
            mimeType:req.file.mimetype,
            size:req.file.size,
            uploadedBy:req.user?._id,

        }
    );
     return res
    .status(201)
    .json(new ApiResponse(201, { image }, "Image uploaded successfully"));

});

const getUserImages = asyncHandler(async (req, res) => {
    const images = await Image.find({uploadedBy:req.user._id});

    const host = req.protocol + "://" + req.get("host");
    const imagesWithUrls = images.map(img => ({
        ...img._doc,
        fileUrl: host + "/" + img.filePath.replace(/\\/g, "/") 
    }));

    res.status(200).json(
        new ApiResponse(200, { images: imagesWithUrls }, "Images fetched successfully")
    );
});

const deleteImages=asyncHandler(async(req,res)=>{
    const userId=req.user?._id;

    if(!userId)
    {
        throw new ApiError(400,"Unauthorized: user not found")
    }
    const userImages=await Image.find({uploadedBy:userId});

    if(userImages.length===0)
    {
        return res.status(200).json(new ApiResponse(200,{},"No images found for this user"));
    }

    for(const img of userImages)
    {
        const filePath=path.resolve(img.filePath);
        fs.unlink(filePath,(err)=>{
                if(err){
                    throw new ApiError(404,"files could not be deleted");
                }
        });
    }
    await Image.deleteMany({uploadedBy:userId});
    return res.status(200).
    json(new ApiResponse(200,{},"images deleted sucessfully"));
});

const getImageById=asyncHandler(async(req,res)=>{
    const {imageId}= req.params;
    const image=await Image.findById(imageId);
    if(!image)
    {
        throw new ApiError(404,"Image not found")
    }
    let normalizedPath = image.filePath.replace(/\\/g, "/");
    const absolutePath = path.resolve(normalizedPath);

    if(!fs.existsSync(absolutePath))
    {
        throw new ApiError(404,"File not found in directory")
    }
    res.download(absolutePath,image.fileName)
})



export {uploadImage,getUserImages,deleteImages,getImageById};