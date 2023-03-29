// import packages and local modules
const router = require('express').Router();
const userRoutes = require('./userRoutes');
const thoughtRoutes = require('./thoughtRoutes');

// define route paths
router.use('/users', userRoutes);
router.use('/thoughts', thoughtRoutes);

module.exports = router;
