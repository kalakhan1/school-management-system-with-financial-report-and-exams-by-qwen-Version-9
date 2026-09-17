const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const dataManagerController = require('../controllers/dataManager.controller');

router.use(protect);

// ✅ Fixed: All data manager operations are Admin only
router.get('/models', isAdmin, dataManagerController.getAvailableModels);
router.get('/:model', isAdmin, dataManagerController.getData);
router.put('/:model/:id', isAdmin, dataManagerController.updateData);
router.delete('/:model/:id', isAdmin, dataManagerController.deleteData);

module.exports = router;