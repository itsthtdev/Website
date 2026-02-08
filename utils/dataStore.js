// Data store with Appwrite backend support
// Falls back to in-memory storage if Appwrite is not configured

const appwrite = require('./appwrite');

class DataStore {
  constructor() {
    // Check if Appwrite is configured
    this.useAppwrite = appwrite.isConfigured();
    
    if (this.useAppwrite) {
      console.log('✅ Appwrite configured - using cloud database');
    } else {
      console.log('⚠️  Appwrite not configured - using in-memory storage (development only)');
    }
    
    // In-memory storage (fallback when Appwrite is not configured)
    this.visits = [];
    this.contactSubmissions = [];
    this.downloads = [];
    this.subscriptionEvents = [];
    
    // Initialize with some example data for testing (development only)
    if (!this.useAppwrite && process.env.NODE_ENV !== 'production') {
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
  async trackVisit(visitData) {
    if (this.useAppwrite) {
      try {
        const visit = await appwrite.visitOperations.create(visitData);
        return visit;
      } catch (error) {
        console.error('Failed to track visit in Appwrite:', error);
        // Fallback to in-memory
        return this._trackVisitInMemory(visitData);
      }
    } else {
      return this._trackVisitInMemory(visitData);
    }
  }

  _trackVisitInMemory(visitData) {
    const visit = {
      id: `visit-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      ...visitData
    };
    this.visits.push(visit);
    return visit;
  }

  async getVisits(filters = {}) {
    if (this.useAppwrite) {
      try {
        const queries = [];
        if (filters.startDate) {
          queries.push(appwrite.Query.greaterThanEqual('timestamp', filters.startDate));
        }
        if (filters.endDate) {
          queries.push(appwrite.Query.lessThanEqual('timestamp', filters.endDate));
        }
        if (filters.path) {
          queries.push(appwrite.Query.equal('path', filters.path));
        }
        queries.push(appwrite.Query.orderDesc('timestamp'));
        
        const result = await appwrite.visitOperations.list(queries);
        return result.documents;
      } catch (error) {
        console.error('Failed to get visits from Appwrite:', error);
        // Fallback to in-memory
        return this._getVisitsInMemory(filters);
      }
    } else {
      return this._getVisitsInMemory(filters);
    }
  }

  _getVisitsInMemory(filters = {}) {
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

  async getVisitStats(days = 7) {
    if (this.useAppwrite) {
      try {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const queries = [
          appwrite.Query.greaterThanEqual('timestamp', cutoff)
        ];
        
        const result = await appwrite.visitOperations.list(queries);
        const recentVisits = result.documents;
        
        return {
          total: recentVisits.length,
          unique: new Set(recentVisits.map(v => v.ip)).size,
          byDay: this.groupByDay(recentVisits)
        };
      } catch (error) {
        console.error('Failed to get visit stats from Appwrite:', error);
        return this._getVisitStatsInMemory(days);
      }
    } else {
      return this._getVisitStatsInMemory(days);
    }
  }

  _getVisitStatsInMemory(days = 7) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentVisits = this.visits.filter(v => new Date(v.timestamp) >= cutoff);
    
    return {
      total: recentVisits.length,
      unique: new Set(recentVisits.map(v => v.ip)).size,
      byDay: this.groupByDay(recentVisits)
    };
  }

  // Contact submissions
  async trackContactSubmission(submission) {
    if (this.useAppwrite) {
      try {
        const contact = await appwrite.contactOperations.create(submission);
        return contact;
      } catch (error) {
        console.error('Failed to track contact in Appwrite:', error);
        return this._trackContactInMemory(submission);
      }
    } else {
      return this._trackContactInMemory(submission);
    }
  }

  _trackContactInMemory(submission) {
    const contact = {
      id: `contact-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...submission
    };
    this.contactSubmissions.push(contact);
    return contact;
  }

  async getContactSubmissions(filters = {}) {
    if (this.useAppwrite) {
      try {
        const queries = [];
        if (filters.status) {
          queries.push(appwrite.Query.equal('status', filters.status));
        }
        queries.push(appwrite.Query.orderDesc('timestamp'));
        
        const result = await appwrite.contactOperations.list(queries);
        return result.documents;
      } catch (error) {
        console.error('Failed to get contacts from Appwrite:', error);
        return this._getContactsInMemory(filters);
      }
    } else {
      return this._getContactsInMemory(filters);
    }
  }

  _getContactsInMemory(filters = {}) {
    let submissions = [...this.contactSubmissions];
    
    if (filters.status) {
      submissions = submissions.filter(s => s.status === filters.status);
    }
    
    return submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Download tracking
  async trackDownload(downloadData) {
    if (this.useAppwrite) {
      try {
        const download = await appwrite.downloadOperations.create(downloadData);
        return download;
      } catch (error) {
        console.error('Failed to track download in Appwrite:', error);
        return this._trackDownloadInMemory(downloadData);
      }
    } else {
      return this._trackDownloadInMemory(downloadData);
    }
  }

  _trackDownloadInMemory(downloadData) {
    const download = {
      id: `download-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...downloadData
    };
    this.downloads.push(download);
    return download;
  }

  async getDownloads(filters = {}) {
    if (this.useAppwrite) {
      try {
        const queries = [];
        if (filters.userId) {
          queries.push(appwrite.Query.equal('userId', filters.userId));
        }
        if (filters.platform) {
          queries.push(appwrite.Query.equal('platform', filters.platform));
        }
        queries.push(appwrite.Query.orderDesc('timestamp'));
        
        const result = await appwrite.downloadOperations.list(queries);
        return result.documents;
      } catch (error) {
        console.error('Failed to get downloads from Appwrite:', error);
        return this._getDownloadsInMemory(filters);
      }
    } else {
      return this._getDownloadsInMemory(filters);
    }
  }

  _getDownloadsInMemory(filters = {}) {
    let downloads = [...this.downloads];
    
    if (filters.userId) {
      downloads = downloads.filter(d => d.userId === filters.userId);
    }
    if (filters.platform) {
      downloads = downloads.filter(d => d.platform === filters.platform);
    }
    
    return downloads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  async getDownloadStats() {
    if (this.useAppwrite) {
      try {
        const result = await appwrite.downloadOperations.list([
          appwrite.Query.orderDesc('timestamp'),
          appwrite.Query.limit(10)
        ]);
        const downloads = result.documents;
        
        return {
          total: result.total || downloads.length,
          byPlatform: this.groupBy(downloads, 'platform'),
          recent: downloads.slice(0, 10)
        };
      } catch (error) {
        console.error('Failed to get download stats from Appwrite:', error);
        return this._getDownloadStatsInMemory();
      }
    } else {
      return this._getDownloadStatsInMemory();
    }
  }

  _getDownloadStatsInMemory() {
    return {
      total: this.downloads.length,
      byPlatform: this.groupBy(this.downloads, 'platform'),
      recent: this.downloads.slice(0, 10)
    };
  }

  // Subscription events
  async trackSubscriptionEvent(event) {
    if (this.useAppwrite) {
      try {
        const subEvent = await appwrite.subscriptionOperations.create(event);
        return subEvent;
      } catch (error) {
        console.error('Failed to track subscription in Appwrite:', error);
        return this._trackSubscriptionInMemory(event);
      }
    } else {
      return this._trackSubscriptionInMemory(event);
    }
  }

  _trackSubscriptionInMemory(event) {
    const subEvent = {
      id: `sub-event-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.subscriptionEvents.push(subEvent);
    return subEvent;
  }

  async getSubscriptionEvents(filters = {}) {
    if (this.useAppwrite) {
      try {
        const queries = [];
        if (filters.userId) {
          queries.push(appwrite.Query.equal('userId', filters.userId));
        }
        if (filters.type) {
          queries.push(appwrite.Query.equal('type', filters.type));
        }
        queries.push(appwrite.Query.orderDesc('timestamp'));
        
        const result = await appwrite.subscriptionOperations.list(queries);
        return result.documents;
      } catch (error) {
        console.error('Failed to get subscriptions from Appwrite:', error);
        return this._getSubscriptionsInMemory(filters);
      }
    } else {
      return this._getSubscriptionsInMemory(filters);
    }
  }

  _getSubscriptionsInMemory(filters = {}) {
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
  async getOverallStats() {
    if (this.useAppwrite) {
      try {
        const [visits, contacts, downloads, subscriptions] = await Promise.all([
          appwrite.visitOperations.list([appwrite.Query.limit(1)]),
          appwrite.contactOperations.list([appwrite.Query.limit(1)]),
          appwrite.downloadOperations.list([appwrite.Query.orderDesc('timestamp'), appwrite.Query.limit(5)]),
          appwrite.subscriptionOperations.list([appwrite.Query.limit(1)])
        ]);
        
        const recentVisits = await this.getVisitStats(7);
        
        return {
          totalVisits: visits.total || 0,
          totalContactSubmissions: contacts.total || 0,
          totalDownloads: downloads.total || 0,
          totalSubscriptionEvents: subscriptions.total || 0,
          recentVisits,
          recentDownloads: downloads.documents.slice(0, 5)
        };
      } catch (error) {
        console.error('Failed to get overall stats from Appwrite:', error);
        return this._getOverallStatsInMemory();
      }
    } else {
      return this._getOverallStatsInMemory();
    }
  }

  _getOverallStatsInMemory() {
    return {
      totalVisits: this.visits.length,
      totalContactSubmissions: this.contactSubmissions.length,
      totalDownloads: this.downloads.length,
      totalSubscriptionEvents: this.subscriptionEvents.length,
      recentVisits: this._getVisitStatsInMemory(7),
      recentDownloads: this.downloads.slice(0, 5)
    };
  }
}

// Singleton instance
const dataStore = new DataStore();

module.exports = dataStore;
