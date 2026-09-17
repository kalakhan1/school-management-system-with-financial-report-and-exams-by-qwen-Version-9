const mongoose = require('mongoose');
const { logAudit, logError } = require('../utils/logger');

// List of all collections to backup (in order of dependency)
const COLLECTIONS_ORDER = [
  'settings',
  'users',
  'classes',
  'students',
  'teachers',
  'feehistories',
  'salaryhistories',
  'expenses',
  'exams',
  'examregistrations',
  'resultcards',
  'testresults',
  'attendances',
  'auditlogs',
  'archives'
];

// @desc    Create Full Database Backup
// @route   GET /api/backup/create
exports.createBackup = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const backupData = {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.fullName || 'System',
        createdByUser: req.user?.username || 'system',
        databaseName: db.databaseName,
        collections: []
      },
      data: {}
    };

    // Get all actual collections in database
    const actualCollections = await db.listCollections().toArray();
    const collectionNames = actualCollections.map(c => c.name).filter(name => !name.startsWith('system.'));

    // Backup each collection
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        backupData.data[collectionName] = documents;
        backupData.metadata.collections.push({
          name: collectionName,
          count: documents.length
        });

        console.log(`✅ Backed up ${collectionName}: ${documents.length} documents`);
      } catch (err) {
        console.error(`❌ Failed to backup ${collectionName}:`, err.message);
        backupData.data[collectionName] = [];
        backupData.metadata.collections.push({
          name: collectionName,
          count: 0,
          error: err.message
        });
      }
    }

    await logAudit('BACKUP_CREATED', {
      userId: req.user?.id,
      collections: backupData.metadata.collections.length,
      totalDocuments: backupData.metadata.collections.reduce((sum, c) => sum + c.count, 0)
    });

    // Send as downloadable JSON file
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(backupData);

  } catch (error) {
    await logError(error, { context: 'createBackup' });
    res.status(500).json({ success: false, error: 'Failed to create backup: ' + error.message });
  }
};

// @desc    Create Selective Backup (Specific Collections)
// @route   POST /api/backup/create-selective
exports.createSelectiveBackup = async (req, res) => {
  try {
    const { collections } = req.body;
    
    if (!collections || !Array.isArray(collections) || collections.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one collection' });
    }

    const db = mongoose.connection.db;
    const backupData = {
      metadata: {
        version: '1.0',
        type: 'selective',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.fullName || 'System',
        databaseName: db.databaseName,
        collections: []
      },
      data: {}
    };

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        backupData.data[collectionName] = documents;
        backupData.metadata.collections.push({
          name: collectionName,
          count: documents.length
        });
      } catch (err) {
        console.error(`❌ Failed to backup ${collectionName}:`, err.message);
      }
    }

    await logAudit('SELECTIVE_BACKUP_CREATED', {
      userId: req.user?.id,
      collections
    });

    const filename = `selective_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).json(backupData);

  } catch (error) {
    await logError(error, { context: 'createSelectiveBackup' });
    res.status(500).json({ success: false, error: 'Failed to create selective backup' });
  }
};

// @desc    Restore Database from Backup
// @route   POST /api/backup/restore
exports.restoreBackup = async (req, res) => {
  try {
    const backupData = req.body;

    // Validate backup structure
    if (!backupData || !backupData.metadata || !backupData.data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid backup file format. Missing metadata or data.' 
      });
    }

    if (!backupData.metadata.version) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid backup file. Version information missing.' 
      });
    }

    const db = mongoose.connection.db;
    const restoreStats = {
      collections: 0,
      documents: 0,
      errors: []
    };

    // Restore each collection
    for (const [collectionName, documents] of Object.entries(backupData.data)) {
      if (!Array.isArray(documents)) continue;

      try {
        const collection = db.collection(collectionName);
        
        // Clear existing data in this collection
        await collection.deleteMany({});
        
        // Insert backup data if not empty
        if (documents.length > 0) {
          // Clean _id fields to let MongoDB regenerate them (avoid duplicates)
          const cleanedDocs = documents.map(doc => {
            const { _id, __v, ...rest } = doc;
            return rest;
          });
          
          await collection.insertMany(cleanedDocs, { ordered: false });
        }

        restoreStats.collections++;
        restoreStats.documents += documents.length;
        
        console.log(`✅ Restored ${collectionName}: ${documents.length} documents`);
      } catch (err) {
        console.error(`❌ Failed to restore ${collectionName}:`, err.message);
        restoreStats.errors.push({
          collection: collectionName,
          error: err.message
        });
      }
    }

    await logAudit('DATABASE_RESTORED', {
      userId: req.user?.id,
      backupDate: backupData.metadata.createdAt,
      collectionsRestored: restoreStats.collections,
      documentsRestored: restoreStats.documents,
      errors: restoreStats.errors.length
    });

    res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      data: restoreStats
    });

  } catch (error) {
    await logError(error, { context: 'restoreBackup' });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to restore backup: ' + error.message 
    });
  }
};

// @desc    Get Database Info (for backup planning)
// @route   GET /api/backup/info
exports.getBackupInfo = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    const collections = await db.listCollections().toArray();

    const collectionDetails = [];
    for (const coll of collections.filter(c => !c.name.startsWith('system.'))) {
      const count = await db.collection(coll.name).countDocuments();
      collectionDetails.push({
        name: coll.name,
        displayName: formatCollectionName(coll.name),
        count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        databaseName: db.databaseName,
        dataSize: stats.dataSize || 0,
        storageSize: stats.storageSize || 0,
        collections: collectionDetails
      }
    });
  } catch (error) {
    await logError(error, { context: 'getBackupInfo' });
    res.status(500).json({ success: false, error: 'Failed to fetch database info' });
  }
};

// Helper: Format collection name for display
function formatCollectionName(name) {
  const map = {
    'users': 'Users',
    'students': 'Students',
    'teachers': 'Teachers',
    'classes': 'Classes',
    'feehistories': 'Fee History',
    'salaryhistories': 'Salary History',
    'expenses': 'Expenses',
    'exams': 'Exams',
    'examregistrations': 'Exam Registrations',
    'resultcards': 'Result Cards',
    'testresults': 'Test Results',
    'attendances': 'Attendance',
    'auditlogs': 'Audit Logs',
    'archives': 'Archive/Trash',
    'settings': 'Settings'
  };
  return map[name] || name;
}