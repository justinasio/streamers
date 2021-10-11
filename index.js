require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const compression = require('compression');
const helmet = require('helmet');

// Models
const Twitch = require('./models/Twitch');
const User = require('./models/User');

// Routes
const authRoutes = require('./routes/auth_routes');

// App
const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static('public'));

// Authenticate user
app.use((req, res, next) => {
    // No cookie = not logged in
    if (!req.cookies.auth_token) {
        res.locals.isLoggedIn = false;
        return next();
    }
    const token = req.cookies.auth_token;

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        // Invalid cookie = not logged in
        if (err) {
            res.locals.isLoggedIn = false;
            res.clearCookie('auth_token');
            return next();
        }

        // Find a user
        const findUser = await User.findOne({ _id: decoded._id });

        if (!findUser) return next();

        res.locals.isLoggedIn = true;
        res.locals.permissions = findUser.permissions;
        res.locals.login = findUser.username;

        next();
    });
});

// Routes
app.use(authRoutes);

// 404
app.use((req, res, next) => {
    res.status(404).render('error/404', {
        page_title: 'Not found',
    });
});

// When connected to a database -- start the application
mongoose.connect(process.env.MONGODB_URI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
});
mongoose.connection.on('open', async () => {
    console.log('Connected to Mongoose');

    // Store channels data locally on boot
    await Twitch.storeChannelsData();
    // After that store channels data every 3 minutes
    setInterval(async () => {
        await Twitch.storeChannelsData();
    }, 1000 * 60 * 3);

    app.listen(process.env.PORT || 3000);
});
mongoose.connection.on('error', (err) => console.log(err));
