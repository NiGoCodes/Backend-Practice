import {mongoose , Schema} from "mongoose";
const userSchema = new Schema({
    username: {
        type: String, 
        required: true,
        unique: true,
        trim: true, 
        lowercase: true,
        index: true
    },
    email: {
        type: String, 
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    }, 
    fullname : {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String,
        required: true,
    },
    coverImage:{
        type: String,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    watchHistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }],
    refreshToken: {
        type: String,
    },
} , {timestamps: true});

export const User = mongoose.model("User" , userSchema);;