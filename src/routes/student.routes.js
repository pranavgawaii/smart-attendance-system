const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');

router.get('/my-allocation', studentController.getMyAllocation);

module.exports = router;
