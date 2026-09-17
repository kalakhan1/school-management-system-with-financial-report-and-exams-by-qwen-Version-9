const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAcademicStaff, isAdmin } = require('../middleware/roleCheck');
const resultController = require('../controllers/result.controller');
const { createResultValidation } = require('../validators/result.validator');

router.use(protect);

router.get('/', resultController.getResultCards);
router.get('/:id', resultController.getResultCardById);
router.post('/', isAcademicStaff, createResultValidation, resultController.createResultCard);
router.delete('/:id', isAdmin, resultController.deleteResultCard);

module.exports = router;