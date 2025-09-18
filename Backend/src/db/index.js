import mongoose from "mongoose";
const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}`)
        console.log(`Mongodb connected successfully: DB HOST ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("error: ",error);
        process.exit(1);
    }
}

export default connectDB;