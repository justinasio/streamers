const { Router } = require('express');
const router = Router();

const publicController = require('../controllers/public_controller');

// Authentication routes
router.get('/', publicController.get_index);

module.exports = router;
