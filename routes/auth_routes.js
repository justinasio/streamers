const { Router } = require('express');
const router = Router();

const authController = require('../controllers/auth_controller');

// Authentication parameters
function isAuthenticated(req, res, next) {
    if (res.locals.isLoggedIn) {
        return res.redirect('/dashboard');
    } else {
        next();
    }
}
function isNotAuthenticated(req, res, next) {
    if (!res.locals.isLoggedIn) {
        return res.redirect('/login');
    } else {
        next();
    }
}

// Authorization parameters
function defaultAuthorization(req, res, next) {
    if (res.locals.permissions === 'default' || res.locals.permissions === 'admin') {
        return next();
    }
    res.status(401).json({
        status: 401,
        message: 'You are not authorized',
    });
}
function adminAuthorization(req, res, next) {
    if (res.locals.permissions === 'admin') {
        return next();
    }
    res.status(401).json({
        status: 401,
        message: 'You are not authorized',
    });
}

// Authentication routes
router.get('/login', isAuthenticated, authController.get_login);
router.get('/signup', isAuthenticated, authController.get_signup);
router.post('/login', isAuthenticated, authController.post_login);
router.post('/signup', isAuthenticated, authController.post_signup);
router.post('/logout', isNotAuthenticated, authController.post_logout);

// Dashboard routes
router.get('/dashboard', isNotAuthenticated, authController.get_dashboard);
router.post('/search-channel', defaultAuthorization, authController.post_search_channel);
router.post('/add-channel', adminAuthorization, authController.post_add_channel);
router.post('/remove-channel', adminAuthorization, authController.post_remove_channel);

module.exports = router;
