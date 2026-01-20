const express = require('express');
const router = express.Router();
const { verifyToken } = require('./auth');

// Download configuration based on platform
const DOWNLOAD_CONFIG = {
  windows: {
    name: 'EzClippin for Windows',
    filename: process.env.EZCLIPPIN_INSTALLER_WINDOWS || 'EzClippin-Setup.exe',
    platform: 'win32',
    size: 'TBD'
  },
  mac: {
    name: 'EzClippin for macOS',
    filename: process.env.EZCLIPPIN_INSTALLER_MAC || 'EzClippin.dmg',
    platform: 'darwin',
    size: 'TBD'
  },
  linux: {
    name: 'EzClippin for Linux',
    filename: process.env.EZCLIPPIN_INSTALLER_LINUX || 'ezclippin-linux.tar.gz',
    platform: 'linux',
    size: 'TBD'
  }
};

// Get download info for all platforms
router.get('/info', (req, res) => {
  const baseUrl = process.env.DOWNLOAD_BASE_URL || 'https://github.com/itsthtdev/VS_auto_clipper/releases/latest/download';
  
  const downloads = Object.entries(DOWNLOAD_CONFIG).map(([key, config]) => ({
    platform: key,
    name: config.name,
    filename: config.filename,
    url: `${baseUrl}/${config.filename}`,
    size: config.size
  }));

  res.json({
    downloads,
    latestVersion: '1.0.0',
    releaseDate: new Date().toISOString(),
    changelog: [
      'Initial release',
      'AI-powered clip detection',
      'Multi-platform support',
      'Cloud sync capabilities'
    ]
  });
});

// Get download link for specific platform
router.get('/:platform', verifyToken, (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const config = DOWNLOAD_CONFIG[platform];

  if (!config) {
    return res.status(400).json({ 
      error: 'Invalid platform',
      validPlatforms: Object.keys(DOWNLOAD_CONFIG)
    });
  }

  // In production, log download for analytics
  console.log(`Download requested: ${config.name} by user ${req.userId}`);

  const baseUrl = process.env.DOWNLOAD_BASE_URL || 'https://github.com/itsthtdev/VS_auto_clipper/releases/latest/download';
  const downloadUrl = `${baseUrl}/${config.filename}`;

  res.json({
    platform,
    name: config.name,
    filename: config.filename,
    downloadUrl,
    message: 'Download link generated successfully'
  });
});

// Track download completion (for analytics)
router.post('/track', verifyToken, (req, res) => {
  const { platform, version, success } = req.body;

  // In production, log to analytics service
  console.log(`Download tracked:`, {
    userId: req.userId,
    platform,
    version,
    success,
    timestamp: new Date().toISOString()
  });

  res.json({ message: 'Download tracked successfully' });
});

// Get user's download history
router.get('/history/list', verifyToken, (req, res) => {
  // In production, fetch from database
  // For now, return mock data
  res.json({
    downloads: [
      {
        id: '1',
        platform: 'windows',
        version: '1.0.0',
        downloadedAt: new Date().toISOString(),
        size: '45MB'
      }
    ]
  });
});

module.exports = router;
