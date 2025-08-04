import connectDB from './db/index.js'
import express from 'express';
const app = express();
connectDB()
.then(() => {
    app.on("error" , (error) =>{
        console.log('Server is not connected :' , error);
        throw error;
    })
    app.listen((process.env.PORT || 8000) , () => {
        console.log(`Server is running at PORT : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
});