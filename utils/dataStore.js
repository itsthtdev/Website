// In-memory data store for analytics and tracking
// In production, replace with a proper database

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
  }

  initializeTestData() {
    // Add some test visits
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      const visitDate = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000);
      this.visits.push({
        id: `visit-${i}`,
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
      id: `visit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...visitData
    };
    this.visits.push(visit);
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
      id: `contact-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...submission
    };
    this.contactSubmissions.push(contact);
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
      id: `download-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...downloadData
    };
    this.downloads.push(download);
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
    return {
      total: this.downloads.length,
      byPlatform: this.groupBy(this.downloads, 'platform'),
      recent: this.downloads.slice(0, 10)
    };
  }

  // Subscription events
  trackSubscriptionEvent(event) {
    const subEvent = {
      id: `sub-event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.subscriptionEvents.push(subEvent);
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
    return {
      totalVisits: this.visits.length,
      totalContactSubmissions: this.contactSubmissions.length,
      totalDownloads: this.downloads.length,
      totalSubscriptionEvents: this.subscriptionEvents.length,
      recentVisits: this.getVisitStats(7),
      recentDownloads: this.downloads.slice(0, 5)
    };
  }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
