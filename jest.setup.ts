import '@testing-library/jest-dom';

// Use test database
process.env.MONGODB_URI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/congressdoyourjob_test';
process.env.GOOGLE_API_KEY = 'test_google_api_key';
process.env.NODE_ENV = 'test';
