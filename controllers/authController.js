const crypto = require('crypto');

const { promisify } = require('util');
const User = require('../models/usersModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const jwt = require('jsonwebtoken');
const Email = require('../utils/email');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendToken = (user, statusCode, res) => {
  const token = createToken(user._id);

  //Sending token as cookie in to http header
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //Removing the password
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}`;
  await new Email(newUser, url).sendWelcome();

  sendToken(newUser, 201, res);
  // const token = createToken(newUser._id);

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1)Check if the email & password are exist
  if (!email || !password) {
    return next(new AppError('Please provide the email and password !!', 400));
  }

  //2)Check if the email and password are correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!!', 401));
  }

  //Creating token & Send token to the user for login
  sendToken(user, 200, res);
});

exports.protectStudentRoute = catchAsync(async (req, res, next) => {
  //1)Getting token and if it's there
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  //2)Check if the token is exist
  if (!token) {
    return next(new AppError('You are not logged in! Please Login to get access!!', 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exist in database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('User no longer belongs with  this token !!', 401));
  }

  //4)Check if password change after the token issued
  if (currentUser.changePassAfterTokenIssued(decoded.iat)) {
    return next(new AppError('User has recently changed the password !! Please login with new password', 401));
  }

  req.user = currentUser;
  next();
});

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You have not permission to get access !!', 403));
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  //Get a user  POSTed email  id to check if the email id exist
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    next(new AppError('Please provide a valid email Id !!', 404));
  }
  //Generate the random reset token
  const resetToken = user.createForgotPassToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendResetToken();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.forgotPassToken = undefined;
    user.forgotPassTokenExpriresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error to sending the email !! Please try again later', 500));
  }
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get the token from params and hashed that
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  //Compare and assign then token to forgotPassToken and check if the token is expired
  const user = await User.findOne({ forgotPassToken: hashedToken, forgotPassTokenExpriresIn: { $gt: Date.now() } });

  //Check if the user token is valid and if valid set a new password
  if (!user) {
    return next(new AppError('Token is not valid or has expired !', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.forgotPassToken = undefined;
  user.forgotPassTokenExpriresIn = undefined;
  await user.save();

  if (!req.body.password && !req.body.passwordConfirm) {
    return next(new AppError('You have to set a new password in body', 400));
  }
  //Log the user in and send the JWT
  sendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)Get the user from collection
  const user = await User.findById(req.user.id).select('+password');

  //2)Check if the user POSTed current password is correct
  if (await !user.comparePassword(req.body.password, user.password)) {
    return next(new AppError('Please provide the currect user password to update the new password!!', 401));
  }

  //3)If correct then update the password
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();

  //4)Login the user,send Jwt
  sendToken(user, 200, res);
});
