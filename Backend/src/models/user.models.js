import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
const { ObjectId } = mongoose.Schema.Types;
const userSchema = new mongoose.Schema(
  {
    fullName:{type:String,required:true},
    age:{type:Number,required:true},
    gender:{type:String,required:true},
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: '' }
    },
    password: { type: String, required: true }, 
    role: { type: String, enum: ["user", "admin"], default: "user" },
    verification: {
      status: {
        type: String,
        enum: ["Unverified", "Pending", "Verified", "Rejected"],
        default: "Unverified",
      },
      documentUrl: { type: String, default: null }, 
    },

    familyMembers: [
      {
        // _id: ObjectId, 
        fullName: { type: String, required: true },
        relationship: { type: String, required: true }, 
        age: { type: Number, required: true },
        verification: {
          status: {
            type: String,
            enum: ["Unverified", "Pending", "Verified", "Rejected"],
            default: "Unverified",
          },
          documentUrl: { type: String, default: null },
        },
      },
    ],
    refreshToken: {
        type: String
    }
  },
  { timestamps: true }
);

userSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next();
    this.password= await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken =  function(){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            role:this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken =  function(){
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
userSchema.pre("save", function (next) {
  this.familyMembers = this.familyMembers.map(familyMember => {
    if (familyMember.age < 18) {
      delete familyMember.verification;
    }
    return familyMember;
  });
  next();
});

export const User = mongoose.model("User",userSchema);