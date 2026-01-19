const express = require('express');
const userRouter = require('./src/routes/userRoutes.js');
const gameRouter = require('./src/routes/gameRoutes.js');
const favoriteRouter = require('./src/routes/favoriteRoutes.js');
const cartRouter = require('./src/routes/cartRoutes.js');
const authRouter = require('./src/routes/authRoutes.js');
const AppError = require("./src/utils/appError.js");
const cookieParser = require('cookie-parser');
const passport = require('./src/config/passport');
const app = express();
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());

app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

app.use((req, res, next) => {
    console.log("labas is middleware");
    req.requestTime = new Date().toISOString();
    next();
});

app.use((req, res, next) => {
    console.log("Hello from middleware");
    next();
});

app.use((req, res, next) => {
    console.log(req.requestTime);
    next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1', gameRouter);
app.use('/api/v1', favoriteRouter);
app.use('/api/v1', cartRouter);


app.all(/(.*)/, (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';
    const message = err.message || 'Something went very wrong!';
    
    res.status(statusCode).json({
        status: status,
        message: message,
    });
});

app.use((err, req, res, next) => {
    const errMessage = err.message || "Internal server Error";
    const statusCode = err.statusCode || 500;
    const errStatus = err.status || "error";
  
    res.status(statusCode).json({
      status: errStatus,
      message: errMessage,
      stack: err.stack,
    });
});

module.exports = app;