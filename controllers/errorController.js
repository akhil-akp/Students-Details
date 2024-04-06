const AppError = require('../utils/appError');

const castErrHandler = (err) => {
  const message = `Invaild ${err.path}:${err.value}`;
  return new AppError(message, 404);
};

const duplicateKeyErrHandler = (err) => {
  const message = `'${err.keyValue.name}' : name  has been already used ! Try some other`;
  return new AppError(message, 400);
};

const validationErrHandler = (err) => {
  const message = Object.values(err.errors).map((el) => el.message);
  return new AppError(message, 400);
};

const tokenExpiresErrHandler = () => new AppError('Your token has been expired ! Login again to get access!!', 401);

const jwtErrHandler = () => new AppError('Invalid token !! Please provide valid one!!', 401);

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.error('ERROR ⚫', err); //This is for developers only

    //Send a generic message to the client when error occured  during using third party libraries
    res.status(500).json({
      status: 'err',
      message: 'Somthing went wrong!!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);

    if (err.name === 'CastError') error = castErrHandler(error);
    if (err.code === 11000) error = duplicateKeyErrHandler(error);
    if (err.name === 'ValidationError') error = validationErrHandler(error);
    if (err.name === 'TokenExpiredError') error = tokenExpiresErrHandler();
    if (err.name === 'JsonWebTokenError') error = jwtErrHandler();
    sendErrProd(error, res);
  }
};
