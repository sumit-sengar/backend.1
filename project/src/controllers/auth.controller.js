import {User} from "../models/user.model.js"
import {ApiResponse} from "../utils/api-response.js"
import {ApiError} from "../utils/api-error.js"
import {asyncHandler} from "../utils/async-handler.js"
import {sendMail,forgotpassowrdMailgenContent} from "../utils/mail.js"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import path from "path"
import fs from "fs"

const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false})
        
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong while generating access and refresh token");
    }
};

const registerUser=asyncHandler(async(req,res)=>{
    const {firstName,lastName,username,email,password,role}=req.body
    const existedUser=await User.findOne(
        {
            $or:[{email},{username}],
        }
    );
    if(existedUser)
    {
        throw new ApiError(409,"User with email or username already exists",[]);
    }
    const user =await User.create({
        email,
        password,
        username,
        firstName,
        lastName,
        role
    });
    await user.save({validateBeforeSave:false})

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user")
    }
    return res
    .status(201)
    .json(
        new ApiResponse(200,{user:createdUser},"User registered successfully"),
    );
});

const login=asyncHandler(async(req,res)=>{
    const {email,password}=req.body

    if(!email)
    {
        throw new ApiError(400,"Email is required")
    }
    const user=await User.findOne({email});
    
    if(!user)
    {
        throw new ApiError(400,"User does not exist")
    }
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid)
    {
        throw new ApiError(400,"Invalid credentials");
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
    const loggedInUser=await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in sucessfully"
        )
    )

});

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:""}
        },
        {
            new:true
        },
    );
    const options={
        httpOnly:true,
        secure:true, 
    };
    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"user logged out")
    )
});

const getUserdetails=asyncHandler(async(req,res)=>{
    const {email}=req.body;
    if(!email)
    {
        throw new ApiError(400,"email is required")
    }
    const user=await User.findOne({email}).select("-password -refreshToken");
    if(!user)
    {
        throw new ApiError(404,"user not found");
    }
    return res.status(200).json(
        new ApiResponse(200,{user},"user fetched successfully")
    );    
})

const getMe=asyncHandler(async(req,res)=>{
    const role= await req.user?.role;
    return res.status(200).json(
        new ApiResponse(200,{role:role  },"user is authenticated")
    );
});


const getUsers=asyncHandler(async(req,res)=>{
     try {
    let { page = 1, pageSize = 20, search = "" } = req.query;

    page = parseInt(page, 10);
    pageSize = parseInt(pageSize, 10);

    const filter = {};

    if (search) {
      filter.email = { $regex: search, $options: "i" };
    }

    const users = await User.aggregate([
      // 1) FILTER (use index)
      { $match: filter },

      // 2) SORT (use index)
      { $sort: { createdAt: -1 } },

      // 3) FACET (single DB hit)
      {
        $facet: {
          metadata: [{ $count: "totalCount" }],
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    const totalCount = users[0].metadata[0]?.totalCount || 0;
    const baseUrl=req.protocol+"://"+req.get("host");
   
    const userWithImages=users[0].data.map(user=>{
    return{
        ...user,
        profilePictureUrl:user.profilePicture?.filePath
        ? baseUrl+"/"+user.profilePicture.filePath.replace(/\\/g,"/")
        :null,
    };
    });


    res.status(200).json({
      success: true,
      metadata: {
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      data: userWithImages,
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
});

const deleteUser=asyncHandler(async(req,res)=>{
    const {email}=req.body;

    if(!email)
    {
        throw new ApiError(400,"email is required")
    }
    const deleteUser=await User.findOneAndDelete({email})
    if(!deleteUser)
    {
        throw new ApiError(404,"user not found");
    }
    return res.status(200)
    .json(
        new ApiResponse(200,{},"user deleted successfully")
    )
});

const updateUser =asyncHandler(async(req,res)=>{
    const {email,firstName,lastName,role}=req.body

    const user=await User.findOne({email});
    if (!user) {
    throw new ApiError(404, "User not found");
    }
  
    if(firstName)
    {
        user.firstName=firstName;
    }
    if(lastName)
    {
        user.lastName=lastName;
    }
    if(role)
    {
        user.role=role;
    }
    const updatedUser=await user.save();

    const updatedUserDeatils=await User.findById(updatedUser._id).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200,{user:updatedUserDeatils},"user updated successfully")
    );
});

const uploadProfilePicture=asyncHandler(async(req,res)=>{
    if(!req.file)
    {
        throw new ApiError(400,"No image provided");
    }
    const user=await User.findById(req.user?._id);
    if(!user)
    {
        throw new ApiError(404,"User not found");
    }

    if(user.profilePicture?.filePath){
        const oldPath=path.resolve(user.profilePicture.filePath);
        if(fs.existsSync(oldPath))
        {
            fs.unlinkSync(oldPath);
        }
    }
    user.profilePicture={
        fileName:req.file.filename,
        filePath:req.file.path,
        mimeType:req.file.mimetype,
        size:req.file.size,
    };
    await user.save({validateBeforeSave:false});
    
    return res.status(200).json(
        new ApiResponse(200,{profilePicture:user.profilePicture},"Profile picture updated")
    );
});

const uploadProfilePictureAdmin=asyncHandler(async(req,res)=>{
    if(!req.file)
    {
        throw new ApiError(400,"No image provided");
    }
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user)
    {
        throw new ApiError(404,"User not found");
    }

    if(user.profilePicture?.filePath){
        const oldPath=path.resolve(user.profilePicture.filePath);
        if(fs.existsSync(oldPath))
        {
            fs.unlinkSync(oldPath);
        }
    }
    user.profilePicture={
        fileName:req.file.filename,
        filePath:req.file.path,
        mimeType:req.file.mimetype,
        size:req.file.size,
    };
    await user.save({validateBeforeSave:false});
    
    return res.status(200).json(
        new ApiResponse(200,{profilePicture:user.profilePicture},"Profile picture updated")
    );
});

const deleteProfilePicture=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.user._id);
    if(!user)
    {
        throw new ApiError(404,"User not found");
    }
    if(!user.profilePicture?.filePath){
        return res.status(200).json(new ApiResponse(200,{},"No profile picture found"));
    }
    const imgPath=path.resolve(user.profilePicture.filePath);
    if(fs.existsSync(imgPath)){
        fs.unlinkSync(imgPath);
    }

    user.profilePicture=undefined;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,{},"Profile picture deleted"));
});

const deleteProfilePictureAdmin=asyncHandler(async(req,res)=>{
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user)
    {
        throw new ApiError(404,"User not found");
    }
    if(!user.profilePicture?.filePath){
        return res.status(200).json(new ApiResponse(200,{},"No profile picture found"));
    }
    const imgPath=path.resolve(user.profilePicture.filePath);
    if(fs.existsSync(imgPath)){
        fs.unlinkSync(imgPath);
    }

    user.profilePicture=undefined;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new ApiResponse(200,{},"Profile picture deleted"));
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken ;
    if(!incomingRefreshToken)
    {
        throw new ApiError(401,"Unauthorized access")
    }
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id);
        if(!user)
        {
            throw new ApiError(401,"invalid refresh token")
        }
        if(incomingRefreshToken!==user?.refreshToken)
        {
            throw new ApiError(401,"invalid refresh token")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshToken(user._id);
        user.refreshToken=newRefreshToken;
        await user.save();

        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(new ApiResponse(200,{accessToken:accessToken,refreshToken:newRefreshToken},"Access Token refreshed"))

    } catch (error) {
        
    }
});

const resetUserPassword=asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id);

    const isPasswordValid=user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid)
    {
        throw new ApiError(400,"old password is Invalid")
    }
    user.password=newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
    

    
});

const requestResetPassword=asyncHandler(async(req,res)=>{
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user)
    {
        throw new ApiError(404,"User not found to be registered",[])
    }
    const {unhashedToken,hashedToken,tokenExpiry}=await user.generateTemporaryToken();
    user.forgotPasswordToken=hashedToken;
    user.forgotPasswordExpiry=tokenExpiry;
    

    await user.save({validateBeforeSave:false});

    await sendMail({
        email:user?.email,
        subject:"password reset request",
        mailgenContent:forgotpassowrdMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhccccashedToken}`
        ),
    });
    return res.status(200).json(
        new ApiResponse(200,{},"forgot password link sent")
    );
});

const forgotPasswordReset=asyncHandler(async(req,res)=>{
    const {resetToken}=req.params;
    const {newPassword}=req.body;

    let hashedToken=crypto.createHash("sha256").update(resetToken).digest("hex")

    const user=await User.findOne({
        forgotPasswordToken:hashedToken,
        forgotPasswordExpiry:{$gt:Date.now()}
    });
    if(!user){
        throw new ApiError(409,"invalid/expired link")
    }
    user.password=newPassword
    user.forgotPasswordExpiry=undefined
    user.forgotPasswordToken=undefined
    await user.save({validateBeforeSave:false})
    
    return res.status(200).json(new ApiResponse(200,{},"password reset successfully"))
    
});



export {registerUser,login,getUsers,deleteUser,updateUser,logoutUser,refreshAccessToken,resetUserPassword,requestResetPassword,forgotPasswordReset,getUserdetails,getMe,uploadProfilePicture,deleteProfilePicture,uploadProfilePictureAdmin,deleteProfilePictureAdmin};