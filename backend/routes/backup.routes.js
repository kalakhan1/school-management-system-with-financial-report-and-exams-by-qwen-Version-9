const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const { 
  createBackup, 
  createSelectiveBackup, 
  restoreBackup, 
  getBackupInfo 
} = require('../controllers/backup.controller');

router.use(protect);
router.use(isAdmin); // Only Admin can backup/restore

router.get('/create', createBackup);
router.post('/create-selective', createSelectiveBackup);
router.post('/restore', restoreBackup);
router.get('/info', getBackupInfo);

module.exports = router;