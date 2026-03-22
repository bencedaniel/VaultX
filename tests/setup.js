// tests/setup.js - Global Test Setup
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Load test environment
dotenv.config({ path: path.join(process.cwd(), '.env.test'), quiet: true });

// Global timeout for tests (30 seconds)
jest.setTimeout(30000);

// Setup before all tests
beforeAll(async () => {
  console.log('Test Setup: Connecting to test database...');
  try {
    // Connect to MongoDB for integration tests
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to test MongoDB');
    }
  } catch (error) {
    console.warn('Test Setup: DB connection skipped due to error:', error.message);
  }
});

// Cleanup after all tests
afterAll(async () => {
  console.log('Test Cleanup: Disconnecting from database...');
  try {
    await mongoose.disconnect();
    console.log('Disconnected from test MongoDB');
  } catch (error) {
    console.error('Failed to disconnect:', error.message);
  }
});

// Clear all mock calls between tests
afterEach(() => {
  jest.clearAllMocks();
});
