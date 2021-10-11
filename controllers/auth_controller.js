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

// Dashboard
exports.get_dashboard = async (req, res, next) => {
    const channelsData = JSON.parse(await fsPromises.readFile('./data/channels-data.json'));
    const channelsStats = {
        total_online_channels: 0,
        total_offline_channels: 0,
        total_partnered_channels: 0,
        total_viewers_count: 0,
        total_channels: channelsData.length,
    };

    // Assign stats
    for (let i = 0; i < channelsData.length; i++) {
        if (channelsData[i].is_live) {
            channelsStats.total_online_channels++;
            channelsStats.total_viewers_count += channelsData[i].viewer_count;
        }
        if (channelsData[i].broadcaster_type === 'partner') channelsStats.total_partnered_channels++;
    }

    channelsStats.total_offline_channels = channelsData.length - channelsStats.total_online_channels;

    res.render('auth/dashboard', {
        page_title: 'Dashboard',
        channels_stats: channelsStats,
        channels_data: channelsData,
    });
};
exports.post_search_channel = async (req, res, next) => {
    const channelName = req.body.channel_name;
    const regEx = /^\w+$/;

    // Validate
    if (channelName.length < 3 || channelName.length > 25) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name must be 3-25 characters long',
        });
    }
    if (!regEx.test(channelName)) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name must contain only alphanumeric characters',
        });
    }

    try {
        // Make a request to Twitch API
        const response = await Twitch.searchChannels(channelName);

        if (response.length === 0) {
            return res.status(404).json({
                status: 404,
                message: 'There are no channels to be found',
            });
        }

        res.status(200).json({
            status: 200,
            data: response,
        });
    } catch (e) {
        errorHandler(res);
    }
};
exports.post_add_channel = async (req, res, next) => {
    const channelName = req.body.channel_name;
    const regEx = /^\w+$/;

    // Validate
    if (channelName.length < 3 || channelName.length > 25) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name must be 3-25 characters long.',
        });
    }
    if (!regEx.test(channelName)) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name must contain only alphanumeric characters.',
        });
    }

    try {
        // Find channel
        const findChannel = await Channel.findOne({ channel_name: channelName });

        if (findChannel) {
            return res.status(409).json({
                status: 409,
                message: 'Channel is already added',
            });
        }

        // Define arrays to store data from Twitch API
        let allResponses = [];
        let channelData;

        allResponses = await Twitch.searchChannel(channelName);

        // Validate response
        if (!allResponses) {
            return res.status(404).json({
                status: 404,
                message: 'Bad request. Channel cannot be found',
            });
        }

        // Create new channel modal and save it to the database
        const newChannel = new Channel({
            channel_name: channelName.toLowerCase(),
            date_added: new Date().toUTCString(),
        });

        const saveChannel = await newChannel.save();

        if (!saveChannel) {
            return res.status(500).json({
                status: 500,
                message: 'Something went wrong while saving channel to the database',
            });
        }

        // Create data structure
        channelData = {
            id: allResponses.id,
            login: allResponses.login,
            display_name: allResponses.display_name,
            broadcaster_type: allResponses.broadcaster_type,
            profile_image_url: allResponses.profile_image_url,
        };

        // Get channel followers
        allResponses = await Twitch.getChannelFollowers(channelData.id);
        channelData.followers = allResponses;

        // Check if channel is currently live
        allResponses = await Twitch.getChannelLiveData(channelData.id);

        if (!allResponses) {
            channelData.is_live = false;
        } else {
            channelData.is_live = true;
            channelData.game_name = allResponses.game_name;
            channelData.viewer_count = allResponses.viewer_count;
            channelData.title = allResponses.title;
        }

        // Save channel data locally
        const channelsData = JSON.parse(await fsPromises.readFile('./data/channels-data.json'));
        channelsData.unshift(channelData);
        await fsPromises.writeFile('./data/channels-data.json', JSON.stringify(channelsData));

        res.status(201).json({
            status: 201,
            message: 'Successfully added',
        });
    } catch (e) {
        errorHandler(res);
    }
};
exports.post_remove_channel = async (req, res, next) => {
    const channelName = req.body.channel_name;
    const regEx = /^\w+$/;

    // Validate
    if (!regEx.test(channelName)) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name must contain only alphanumeric characters',
        });
    }
    if (!channelName) {
        return res.status(400).json({
            status: 400,
            message: 'Channel name can not be empty',
        });
    }

    try {
        // Find channel
        const findChannel = await Channel.findOneAndDelete({ channel_name: channelName.toLowerCase() });

        if (!findChannel) {
            return res.status(404).json({
                status: 404,
                message: 'Channel name does not exist',
            });
        }

        // Remove channel data locally
        const channelsData = JSON.parse(await fsPromises.readFile('./data/channels-data.json'));

        const updatedChannelsData = channelsData.filter((channelData) => {
            return channelData.login !== channelName.toLowerCase();
        });

        await fsPromises.writeFile('./data/channels-data.json', JSON.stringify(updatedChannelsData));

        res.status(200).json({
            status: 200,
            message: 'Successfully deleted',
        });
    } catch (e) {
        errorHandler(e);
    }
};
