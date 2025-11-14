import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import fs from "fs";
import path from "path";
import {format,parse} from "fast-csv";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import bcrypt from 'bcryptjs'

const exportUsersToCSV=asyncHandler(async(req,res)=>{

    const cursor=User.find().cursor();
    res.setHeader("content-type","text/csv");
    res.setHeader("content-disposition","attachment; filename=users.csv");

    const csvStream=format({headers:true});
    csvStream.pipe(res);
    for await (const user of cursor) {
        csvStream.write({
            email:user.email,
            username:user.username,
            firstName:user.firstName,
            lastName:user.lastName,
            role:user.role,
        });
    }
    csvStream.end();

});

const importUsersCSV=asyncHandler(async(req,res)=>{
    if(!req.file)
    {
        throw new ApiError(400,"CSV file is required");
    }
     let normalizedPath = req.file.path.replace(/\\/g, "/");
        const absolutePath = path.resolve(normalizedPath);
  
    const stream=fs.createReadStream(normalizedPath);

    const results=[];
    const error=[];
    let rowNumber=0;

    const parser=stream.pipe(parse({headers:true,trim:true}));
    let isInvalidData=false;

    for await (const row of parser)
    {
        rowNumber++;
        const email = (row.email || "").trim();
        const username=(row.username || "").trim();
        const firstName = (row.firstName || "").trim();
        const lastName = (row.lastName || "").trim();
        const role = (row.role || "user").trim();
        const rawPassword = (row.password || "").trim();

        if(!email || !username || !firstName || !lastName || !role || !rawPassword)
        {
            error.push({row:rowNumber,reason:"Missing required details"});
            isInvalidData=true;
            continue;
        }
        const usersObj={email,username,firstName,lastName,role}

        if(rawPassword)
        {
            const salt=await bcrypt.genSalt(10);
            usersObj.password=await bcrypt.hash(rawPassword,salt);
        }
        try{
            const updated= await User.findOneAndUpdate(
                {email},
                {$set:usersObj},
                {upsert:true,new:true,setDefaultsOnInsert:true}

            );
            results.push({row:rowNumber,email,id:updated._id});
        }
        catch(err)
        {
            errors.push({row:rowNumber,email,reason:err.message})
            throw new ApiError(400, "data not able to import");   
        }
    }
    if(isInvalidData==true)
    {
        throw new ApiError(400,"data in file is invalid please check and upload again")
    }
    fs.unlink(absolutePath,(err)=>{
        if(err){
            console.warn("failed to delete csv",err.message);
        throw new ApiError(400,"file could not be delted");}
    }
    );
    return res.status(200).json(
        new ApiResponse(200,{imported:results.length,error},"import completed successfully"))
});

export {exportUsersToCSV,importUsersCSV};