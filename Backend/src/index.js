import dotenv from 'dotenv';
import {app} from "./app.js";
import connectDB  from './db/index.js';
dotenv.config({
    path:"./.env"
});
const port = process.env.PORT ||8000;
connectDB()
.then(()=>{
    console.log("PORT value:", process.env.PORT);
    app.listen(port,()=>{
        console.log(`Server started at port ${port}`)
    })
})
.catch((e)=>{
    console.log("Mongo Db connetion Failed",e)
})