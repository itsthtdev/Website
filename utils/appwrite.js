const { Client, Databases, Users, ID, Query } = require('node-appwrite');
require('dotenv').config();

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '')
  .setKey(process.env.APPWRITE_API_KEY || '');

// Initialize services
const databases = new Databases(client);
const users = new Users(client);

// Database and collection IDs from environment
const config = {
  databaseId: process.env.APPWRITE_DATABASE_ID || '',
  collections: {
    users: process.env.APPWRITE_USERS_COLLECTION_ID || '',
    visits: process.env.APPWRITE_VISITS_COLLECTION_ID || '',
    contacts: process.env.APPWRITE_CONTACTS_COLLECTION_ID || '',
    downloads: process.env.APPWRITE_DOWNLOADS_COLLECTION_ID || '',
    subscriptions: process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID || ''
  }
};

// Check if Appwrite is configured
const isConfigured = () => {
  return !!(
    process.env.APPWRITE_PROJECT_ID &&
    process.env.APPWRITE_API_KEY &&
    process.env.APPWRITE_DATABASE_ID
  );
};

// User operations
const userOperations = {
  // Create a new user in Appwrite Auth
  async create(email, password, name, phone) {
    try {
      const userId = ID.unique();
      const user = await users.create(userId, email, phone, password, name);
      return user;
    } catch (error) {
      console.error('Appwrite user creation error:', error);
      throw error;
    }
  },

  // Get user by ID
  async get(userId) {
    try {
      const user = await users.get(userId);
      return user;
    } catch (error) {
      console.error('Appwrite get user error:', error);
      throw error;
    }
  },

  // List users with filters
  async list(queries = []) {
    try {
      const result = await users.list(queries);
      return result;
    } catch (error) {
      console.error('Appwrite list users error:', error);
      throw error;
    }
  },

  // Update user
  async update(userId, updates) {
    try {
      // Update name if provided
      if (updates.name) {
        await users.updateName(userId, updates.name);
      }
      // Update phone if provided
      if (updates.phone) {
        await users.updatePhone(userId, updates.phone);
      }
      // Update email if provided
      if (updates.email) {
        await users.updateEmail(userId, updates.email);
      }
      // Update password if provided
      if (updates.password) {
        await users.updatePassword(userId, updates.password);
      }
      return await users.get(userId);
    } catch (error) {
      console.error('Appwrite update user error:', error);
      throw error;
    }
  },

  // Delete user
  async delete(userId) {
    try {
      await users.delete(userId);
    } catch (error) {
      console.error('Appwrite delete user error:', error);
      throw error;
    }
  }
};

// Database operations for user profiles (additional data beyond auth)
const userProfileOperations = {
  // Create user profile in database
  async create(userId, data) {
    try {
      const document = await databases.createDocument(
        config.databaseId,
        config.collections.users,
        userId,
        {
          userId,
          subscription: data.subscription || 'free',
          verified: data.verified || false,
          createdAt: new Date().toISOString(),
          ...data
        }
      );
      return document;
    } catch (error) {
      console.error('Appwrite create user profile error:', error);
      throw error;
    }
  },

  // Get user profile
  async get(userId) {
    try {
      const document = await databases.getDocument(
        config.databaseId,
        config.collections.users,
        userId
      );
      return document;
    } catch (error) {
      console.error('Appwrite get user profile error:', error);
      throw error;
    }
  },

  // Update user profile
  async update(userId, data) {
    try {
      const document = await databases.updateDocument(
        config.databaseId,
        config.collections.users,
        userId,
        data
      );
      return document;
    } catch (error) {
      console.error('Appwrite update user profile error:', error);
      throw error;
    }
  },

  // List user profiles
  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.users,
        queries
      );
      return result;
    } catch (error) {
      console.error('Appwrite list user profiles error:', error);
      throw error;
    }
  }
};

// Visit tracking operations
const visitOperations = {
  async create(data) {
    try {
      const document = await databases.createDocument(
        config.databaseId,
        config.collections.visits,
        ID.unique(),
        {
          timestamp: new Date().toISOString(),
          ...data
        }
      );
      return document;
    } catch (error) {
      console.error('Appwrite create visit error:', error);
      throw error;
    }
  },

  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.visits,
        queries
      );
      return result;
    } catch (error) {
      console.error('Appwrite list visits error:', error);
      throw error;
    }
  }
};

// Contact operations
const contactOperations = {
  async create(data) {
    try {
      const document = await databases.createDocument(
        config.databaseId,
        config.collections.contacts,
        ID.unique(),
        {
          timestamp: new Date().toISOString(),
          status: 'new',
          ...data
        }
      );
      return document;
    } catch (error) {
      console.error('Appwrite create contact error:', error);
      throw error;
    }
  },

  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.contacts,
        queries
      );
      return result;
    } catch (error) {
      console.error('Appwrite list contacts error:', error);
      throw error;
    }
  },

  async update(documentId, data) {
    try {
      const document = await databases.updateDocument(
        config.databaseId,
        config.collections.contacts,
        documentId,
        data
      );
      return document;
    } catch (error) {
      console.error('Appwrite update contact error:', error);
      throw error;
    }
  }
};

// Download tracking operations
const downloadOperations = {
  async create(data) {
    try {
      const document = await databases.createDocument(
        config.databaseId,
        config.collections.downloads,
        ID.unique(),
        {
          timestamp: new Date().toISOString(),
          ...data
        }
      );
      return document;
    } catch (error) {
      console.error('Appwrite create download error:', error);
      throw error;
    }
  },

  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.downloads,
        queries
      );
      return result;
    } catch (error) {
      console.error('Appwrite list downloads error:', error);
      throw error;
    }
  }
};

// Subscription event operations
const subscriptionOperations = {
  async create(data) {
    try {
      const document = await databases.createDocument(
        config.databaseId,
        config.collections.subscriptions,
        ID.unique(),
        {
          timestamp: new Date().toISOString(),
          ...data
        }
      );
      return document;
    } catch (error) {
      console.error('Appwrite create subscription error:', error);
      throw error;
    }
  },

  async list(queries = []) {
    try {
      const result = await databases.listDocuments(
        config.databaseId,
        config.collections.subscriptions,
        queries
      );
      return result;
    } catch (error) {
      console.error('Appwrite list subscriptions error:', error);
      throw error;
    }
  }
};

module.exports = {
  client,
  databases,
  users,
  config,
  isConfigured,
  Query,
  ID,
  userOperations,
  userProfileOperations,
  visitOperations,
  contactOperations,
  downloadOperations,
  subscriptionOperations
};
