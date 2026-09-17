const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { getClasses, createClass, deleteClass } = require('../controllers/class.controller');

router.use(protect);

router.get('/', getClasses);
router.post('/', isAdmin, createClass);
router.delete('/:id', isAdmin, deleteClass);

module.exports = router;