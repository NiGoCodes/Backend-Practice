import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.models.js"
import { ApiResponse } from '../utils/ApiResponse.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import jwt from "jsonwebtoken"
const generateAccessTokenAndRefreshToken = async (userId) => {
    try{
        const loggedInUser = await User.findById(userId)
        const accessToken = await loggedInUser.generateAccessToken();
        const refreshToken = await loggedInUser.generateRefreshToken();

        loggedInUser.refreshToken = refreshToken;
        await loggedInUser.save({validateBeforeSave : false})

        return {accessToken , refreshToken};
    }   
    catch{  
        throw new ApiError(500 , "Internal Problems while generating refresh tokens and access tokens");
    }
}

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
    // console.log(req.body);

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

const loginUser = asyncHandler( async ( req , res , next) => {
    // request from body
    // check if anything is missing
    // check if username or email exist
    // check if password is correct 
    // if user is valid then provide him with accessToken and refreshToken
    // cookie 
    
    const {email , username , password} = req.body 
    
    if(!username && !email){
        throw new ApiError(400 , "username or email required")
    }

    const user = await User.findOne({
        $or :[{username} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "User is not existed");
    }
    
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Password is not Correct");
    }
    
    const {accessToken , refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    
    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
            .cookie("refreshToken" , refreshToken , options)
            .cookie("accessToken" , accessToken , options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user : loggedInUser,
                        accessToken,
                        refreshToken
                    },
                    "User loggedIn successfully!"
                )
            )
})

const logoutUser = asyncHandler ( async (req , res , next) => {
    // refresh , accesstoken of the user
    // refresh token delete 

    User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }


    return res.status(200)
            .clearCookie("accessToken" , options)
            .clearCookie("refreshToken" , options)
            .json( new ApiResponse(200 , {} , "User logged out successfully"))
    
})

const refreshAccessToken = asyncHandler (async (req , res , next) => {
    // refreshToken -> cookie , DB
    // verify both
    
    const incomingRefreshToken = await req.cookies?.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401 , "Invalid refresh Token")
        }
    
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401 , "refresh token is expired or used")
        }
    
        const {accessToken , refreshToken} = generateAccessTokenAndRefreshToken(user._id);
        
        return res
        .status(201)
        .cookie("refreshToken" , refreshToken , options)
        .cookie("accessToken" , accessToken , options)
        .json(
            new ApiResponse(
                200,
                {accessToken , refreshToken},
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async (req , res) => {
    const {currentPassword , changePassword} = req.body
    
    const user = User.findById(req.user?._id);

    if( !(await user.isPasswordCorrect(currentPassword)) ){
        throw new ApiError(401 , "Invalid password")
    }

    user.password = changePassword;
    user.save({validateBeforeSave : false})

    return res.status(200)
            .json(
                new ApiResponse(200 , {} , "password changed successfully")
            )
})

const getCurrentUser = asyncHandler ( async (req , res) =>{
    return res.status(200)
    .json(
        new ApiResponse(200 , req.user , "fetched current user")
    )
})

const updateAccountDetails = asyncHandler(async (req , res) => {
    const {fullName , email} = req.body;

    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required");
    }

    const user = user.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName,
                email 
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req , res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")            
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
               avatar : avatar.url     
            }
        },
        {new : true}
    )

    return res.status(200)
            .json(new ApiResponse(200 , user , "Avatar image updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req , res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Avatar file is missing")            
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading on coverImage")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
               avatar : coverImage.url     
            }
        },
        {new : true}
    )

    return res.status(200)
            .json(new ApiResponse(200 , user , "coverImage image updated successfully"))
})

export {registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword, getCurrentUser , updateAccountDetails , updateUserAvatar , updateUserCoverImage};