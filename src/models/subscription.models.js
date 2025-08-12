import mongoose , { Schema } from "mongoose";

const subscriptionSchema = new Schema ({
    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
    },
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "user",
    }
} , {
    timestamps : true
})

export const Subscription = mongoose.model("Subscription" , subscriptionSchema);