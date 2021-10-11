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

// Authentication routes
router.get('/login', isAuthenticated, authController.get_login);
router.get('/signup', isAuthenticated, authController.get_signup);
router.post('/login', isAuthenticated, authController.post_login);
router.post('/signup', isAuthenticated, authController.post_signup);
router.post('/logout', isNotAuthenticated, authController.post_logout);

module.exports = router;
