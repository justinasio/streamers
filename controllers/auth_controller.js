const fsPromises = require('fs').promises;

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const joi = require('joi');

// Models
const Twitch = require('../models/Twitch');
const Channel = require('../models/Channel');
const User = require('../models/User');

// Validators
const loginValidator = joi.object({
    username: joi.string().alphanum().min(3).max(25).required(),
    password: joi.string().min(6).max(25).required(),
});
const signupValidator = joi.object({
    username: joi.string().alphanum().min(3).max(25).required(),
    password: joi.string().min(6).max(25).required(),
    repeatPassword: joi.ref('password'),
});

// Catch error handler
const errorHandler = (res) => {
    res.status(500).json({
        status: 500,
        message: 'Internal server error',
    });
};

// Authentication controllers
exports.get_login = async (req, res, next) => {
    res.render('auth/login', {
        page_title: 'Login',
    });
};
exports.get_signup = async (req, res, next) => {
    res.render('auth/signup', {
        page_title: 'Signup',
    });
};
exports.post_login = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // Validate
        const validation = loginValidator.validate({
            username: username,
            password: password,
        });

        if (validation.error) {
            return res.status(400).json({
                status: 400,
                message: validation.error.details[0].message,
                input: validation.error.details[0].path[0],
            });
        }

        // Find user
        const findUser = await User.findOne({ username: username.toLowerCase() });

        if (!findUser) {
            return res.status(404).json({
                status: 404,
                message: 'Username does not exist',
                input: 'username',
            });
        }

        // Compare passwords
        const comparePasswords = await bcrypt.compare(password, findUser.password);

        if (!comparePasswords) {
            return res.status(403).json({
                status: 403,
                message: 'Password is incorrect',
                input: 'password',
            });
        }

        // Create JWT token
        const payload = {
            _id: findUser._id,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('auth_token', token, { maxAge: 1000 * 60 * 60, httpOnly: true });
        res.status(200).json({
            status: 200,
            message: 'Login successful',
        });
    } catch (e) {
        errorHandler(res);
    }
};
exports.post_signup = async (req, res, next) => {
    const { username, password, repeatPassword } = req.body;

    // Edit process.env to enable/disable registration
    if (process.env.REGISTRATION === 'DISABLED') {
        return res.status(403).json({
            status: 403,
            message: 'Registration is closed',
        });
    }

    try {
        // Validate
        const validation = signupValidator.validate({
            username: username,
            password: password,
            repeatPassword: repeatPassword,
        });

        if (validation.error) {
            return res.status(400).json({
                status: 400,
                message: validation.error.details[0].message,
                input: validation.error.details[0].path[0],
            });
        }

        // Find user
        const findUser = await User.findOne({ username: username.toLowerCase() });

        if (findUser) {
            return res.status(409).json({
                status: 409,
                message: 'Username is already taken',
                input: 'username',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user modal and store it to the database
        const newUser = new User({
            username: username.toLowerCase(),
            password: hashedPassword,
            permissions: 'default',
        });

        const savedUser = await newUser.save();

        // Create JWT token
        const payload = {
            _id: savedUser._id,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('auth_token', token, { maxAge: 1000 * 60 * 60, httpOnly: true });

        res.status(201).json({
            status: 201,
            message: 'Registration successful',
        });
    } catch (e) {
        errorHandler(res);
    }
};
exports.post_logout = async (req, res, next) => {
    res.clearCookie('auth_token');
    res.redirect('/login');
};
