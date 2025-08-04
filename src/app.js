import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors'
const app = express();

// This will allow the CORS_ORIGIN(different server) for accessing the data from our server
app.use(cors({origin: process.env.CORS_ORIGIN,credentials: true}));

// This will encode the url 
app.use(express.urlencoded({extended: true,limit:"16kb"}))

app.use(express.json({limit: '16kb'}))
app.use(cookieParser());
app.use(express.static("public"));