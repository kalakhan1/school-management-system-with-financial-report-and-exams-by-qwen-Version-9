const Setting = require('../models/Setting');
const { logAudit, logError } = require('../utils/logger');

// @desc    Get Settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    await logError(error, { context: 'getSettings' });
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
};

// @desc    Update Settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== '__v') settings[key] = req.body[key];
    });

    await settings.save();

    await logAudit('SETTINGS_UPDATED', {
      userId: req.user.id,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    await logError(error, { context: 'updateSettings' });
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

// @desc    Update Theme Color Only
exports.updateThemeColor = async (req, res) => {
  try {
    const { themeColor } = req.body;
    
    if (!themeColor || !/^#[0-9A-F]{6}$/i.test(themeColor)) {
      return res.status(400).json({ success: false, error: 'Invalid color format. Use hex format (e.g., #0d6efd)' });
    }

    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    settings.themeColor = themeColor;
    await settings.save();

    await logAudit('THEME_COLOR_UPDATED', {
      userId: req.user.id,
      themeColor
    });

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    await logError(error, { context: 'updateThemeColor' });
    res.status(500).json({ success: false, error: 'Failed to update theme color' });
  }
};