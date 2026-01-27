// In-memory data store for analytics and tracking
// In production, replace with a proper database

const crypto = require('crypto');

// Configuration for data retention
const MAX_VISITS = parseInt(process.env.MAX_VISITS) || 10000;
const MAX_CONTACTS = parseInt(process.env.MAX_CONTACTS) || 5000;
const MAX_DOWNLOADS = parseInt(process.env.MAX_DOWNLOADS) || 5000;
const MAX_SUBSCRIPTION_EVENTS = parseInt(process.env.MAX_SUBSCRIPTION_EVENTS) || 5000;
const DATA_RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS) || 7;

class DataStore {
  constructor() {
    // Website visits tracking
    this.visits = [];
    
    // Contact form submissions
    this.contactSubmissions = [];
    
    // Download tracking
    this.downloads = [];
    
    // Subscription events
    this.subscriptionEvents = [];
    
    // Initialize with some example data for testing (development only)
    if (process.env.NODE_ENV !== 'production') {
      this.initializeTestData();
    }
    
    // Set up automatic data cleanup
    this.startDataCleanup();
  }
  
  // Automatic cleanup of old data
  startDataCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);
  }
  
  // Remove data older than retention period and enforce max limits
  cleanupOldData() {
    const cutoffDate = new Date(Date.now() - DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    
    // Clean up old visits
    this.visits = this.visits.filter(v => new Date(v.timestamp) >= cutoffDate);
    this.enforceSizeLimit('visits', MAX_VISITS);
    
    // Clean up old contact submissions
    this.contactSubmissions = this.contactSubmissions.filter(c => new Date(c.timestamp) >= cutoffDate);
    this.enforceSizeLimit('contactSubmissions', MAX_CONTACTS);
    
    // Clean up old downloads
    this.downloads = this.downloads.filter(d => new Date(d.timestamp) >= cutoffDate);
    this.enforceSizeLimit('downloads', MAX_DOWNLOADS);
    
    // Clean up old subscription events
    this.subscriptionEvents = this.subscriptionEvents.filter(e => new Date(e.timestamp) >= cutoffDate);
    this.enforceSizeLimit('subscriptionEvents', MAX_SUBSCRIPTION_EVENTS);
    
    console.log(`Data cleanup completed. Retained data: visits=${this.visits.length}, contacts=${this.contactSubmissions.length}, downloads=${this.downloads.length}, events=${this.subscriptionEvents.length}`);
  }
  
  // FIFO eviction when array exceeds max size
  enforceSizeLimit(arrayName, maxSize) {
    if (this[arrayName].length > maxSize) {
      const excess = this[arrayName].length - maxSize;
      this[arrayName] = this[arrayName].slice(excess); // Remove oldest items (FIFO)
      console.log(`Evicted ${excess} old items from ${arrayName} (FIFO)`);
    }
  }

  initializeTestData() {
    // Add some test visits
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const visitDate = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      this.visits.push({
        id: crypto.randomUUID(),
        timestamp: visitDate.toISOString(),
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        path: '/',
        referrer: Math.random() > 0.5 ? 'https://google.com' : 'direct'
      });
    }
  }

  // Visit tracking
  trackVisit(visitData) {
    const visit = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...visitData
    };
    this.visits.push(visit);
    this.enforceSizeLimit('visits', MAX_VISITS);
    return visit;
  }

  getVisits(filters = {}) {
    let visits = [...this.visits];
    
    if (filters.startDate) {
      visits = visits.filter(v => new Date(v.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      visits = visits.filter(v => new Date(v.timestamp) <= new Date(filters.endDate));
    }
    if (filters.path) {
      visits = visits.filter(v => v.path === filters.path);
    }
    
    return visits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getVisitStats(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentVisits = this.visits.filter(v => new Date(v.timestamp) >= cutoff);
    
    return {
      total: recentVisits.length,
      unique: new Set(recentVisits.map(v => v.ip)).size,
      byDay: this.groupByDay(recentVisits)
    };
  }

  // Contact submissions
  trackContactSubmission(submission) {
    const contact = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...submission
    };
    this.contactSubmissions.push(contact);
    this.enforceSizeLimit('contactSubmissions', MAX_CONTACTS);
    return contact;
  }

  getContactSubmissions(filters = {}) {
    let submissions = [...this.contactSubmissions];
    
    if (filters.status) {
      submissions = submissions.filter(s => s.status === filters.status);
    }
    
    return submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Download tracking
  trackDownload(downloadData) {
    const download = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...downloadData
    };
    this.downloads.push(download);
    this.enforceSizeLimit('downloads', MAX_DOWNLOADS);
    return download;
  }

  getDownloads(filters = {}) {
    let downloads = [...this.downloads];
    
    if (filters.userId) {
      downloads = downloads.filter(d => d.userId === filters.userId);
    }
    if (filters.platform) {
      downloads = downloads.filter(d => d.platform === filters.platform);
    }
    
    return downloads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getDownloadStats() {
    // Sort downloads by timestamp descending to get most recent first
    const sortedDownloads = [...this.downloads].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return {
      total: this.downloads.length,
      byPlatform: this.groupBy(this.downloads, 'platform'),
      recent: sortedDownloads.slice(0, 10) // Get 10 most recent downloads
    };
  }

  // Subscription events
  trackSubscriptionEvent(event) {
    const subEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };
    this.subscriptionEvents.push(subEvent);
    this.enforceSizeLimit('subscriptionEvents', MAX_SUBSCRIPTION_EVENTS);
    return subEvent;
  }

  getSubscriptionEvents(filters = {}) {
    let events = [...this.subscriptionEvents];
    
    if (filters.userId) {
      events = events.filter(e => e.userId === filters.userId);
    }
    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Helper methods
  groupByDay(items) {
    const groups = {};
    items.forEach(item => {
      const day = new Date(item.timestamp).toISOString().split('T')[0];
      groups[day] = (groups[day] || 0) + 1;
    });
    return groups;
  }

  groupBy(items, key) {
    const groups = {};
    items.forEach(item => {
      const value = item[key] || 'unknown';
      groups[value] = (groups[value] || 0) + 1;
    });
    return groups;
  }

  // Get overall stats
  getOverallStats() {
    // Sort downloads by timestamp descending to get most recent first
    const sortedDownloads = [...this.downloads].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return {
      totalVisits: this.visits.length,
      totalContactSubmissions: this.contactSubmissions.length,
      totalDownloads: this.downloads.length,
      totalSubscriptionEvents: this.subscriptionEvents.length,
      recentVisits: this.getVisitStats(7),
      recentDownloads: sortedDownloads.slice(0, 5) // Get 5 most recent downloads
    };
  }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
