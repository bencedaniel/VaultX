import {
  MONGODB_URI,
  PORT,
  SECRET_ACCESS_TOKEN,
  SECURE_MODE,
  SECRET_API_KEY,
  TESTDB,
  TRUST_PROXY,
  DOMAIN,
  TIMEOUT,
} from '../../config/env.js';

describe('config/env', () => {
  test('exports all expected environment variables', () => {
    expect(MONGODB_URI).toBe(process.env.MONGODB_URI);
    expect(PORT).toBe(process.env.PORT);
    expect(SECRET_ACCESS_TOKEN).toBe(process.env.SECRET_ACCESS_TOKEN);
    expect(SECURE_MODE).toBe(process.env.SECURE_MODE);
    expect(SECRET_API_KEY).toBe(process.env.SECRET_API_KEY);
    expect(TESTDB).toBe(process.env.TESTDB);
    expect(TRUST_PROXY).toBe(process.env.TRUST_PROXY);
    expect(DOMAIN).toBe(process.env.DOMAIN);
    expect(TIMEOUT).toBe(process.env.TIMEOUT);
  });

  test('exports values as strings or undefined', () => {
    const values = [
      MONGODB_URI,
      PORT,
      SECRET_ACCESS_TOKEN,
      SECURE_MODE,
      SECRET_API_KEY,
      TESTDB,
      TRUST_PROXY,
      DOMAIN,
      TIMEOUT,
    ];

    for (const value of values) {
      expect(['string', 'undefined']).toContain(typeof value);
    }
  });
});
