const mongoose = require('mongoose');

// @desc    Get Database Stats
exports.getDatabaseStats = async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collections = await mongoose.connection.db.listCollections().toArray();

    const collectionStats = [];
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      collectionStats.push({ name: coll.name, count });
    }

    res.status(200).json({
      success: true,
      data: {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        collections: collectionStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch database stats' });
  }
};