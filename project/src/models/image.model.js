import mongoose,{Schema} from "mongoose";

const imageSchema=new Schema
(
    {
    fileName:{
        type:String,
        required:true
    },
    filePath:{
        type:String,
        required:true
    },
    mimeType:{
        type:String,
        required:true
    },
    size:{
        type:Number,
        required:true
    },
    uploadedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    },
    {
        timestamps:true
    }

);

export const Image=mongoose.model("Image",imageSchema);