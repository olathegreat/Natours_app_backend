const User = require('./../models/userModel');
const {promisify} = require('util');
const AppError = require('./../utils/appError');    
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');    
const { LEGAL_TLS_SOCKET_OPTIONS } = require('mongodb');


const signToken = id =>{
    return jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES
    });
}   

exports.signup = catchAsync(async(req,res, next)=>{

    // only data that is sent to the server is stored in the database

        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt,
            role: req.body.role,
            photo: req.body.photo   
        });

        const token = signToken(newUser._id);

    res.status(201).json({  
        status:'success',
        token,
        data:{
            user:newUser
        }
    })  

  
})

exports.login = catchAsync(async(req,res, next)=>{
    const {email, password} = req.body;

    // 1) check if email and password exist
    if(!email || !password){
        return next(new AppError('Please provide email and password', 400))
    }

    // 2) check if user exists && password is correct
    const user = await User.findOne({email}).select('+password');

    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401))
    }   

    // 3) if everything is ok, send token to client
    const token = signToken(user._id);  

    res.status(200).json({
        status:'success',
        token
    })
})

exports.protect = catchAsync(async(req,res, next)=>{

    // 1) Getting token and check if it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = await req.headers.authorization.split(' ')[1];
        
    }   
    if(!token){
        return next(new AppError('You are not logged in! Please log in to get access', 401))
    }   

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
   
    // 3) Check if user still exists

    const freshUser = await User.findById(decoded.id);  
     
    if(!freshUser){
        return next(new AppError('The user belonging to this token does no longer exist', 401))
    }   

    // 4) Check if user changed password after the token was issued
    if(freshUser.changedPasswordAfter(decoded.iat)){
        return next(new AppError('User recently changed password! Please log in again', 401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;
    next();
})
    

