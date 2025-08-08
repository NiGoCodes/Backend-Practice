import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.models.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const registerUser = asyncHandler( async (req , res , next) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists : username , email
    // check for images and avatars
    // upload them to cloudinary & check if successfully uploaded
    // create user object - create entry in db
    // remove password and refreshToken from response
    // check for user creation 
    // return res
    console.log(req.body);

     const { username , email  , password , fullName} = req.body

     if(
        [username , email  , password , fullName].some((field) => field?.trim() === "" )
     ){
        throw new ApiError(400 , "All fields are required");
     }

     const existedUser = await User.findOne({
        $or :[{username} , {email}] 
    })

    if(existedUser){
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;

     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
     }
    
    // console.log(`local path of images : avatar : ${avatarLocalPath} , coverImage ${coverImageLocalPath}`)
    
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        username : username.toLowerCase(),
        fullName, 
        email , 
        password,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
    })
    // console.log(user)

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    // console.log(createdUser)
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201 ,createdUser , "User is Successfully registered")
    )


})

export {registerUser};