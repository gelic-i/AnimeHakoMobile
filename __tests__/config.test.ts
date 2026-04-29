// config.test.ts - Unit tests for configuration

import { API_BASE_URL, STATIC_BASE_URL, STORAGE_KEYS } from '../config';

describe('config', () => {
  test('API_BASE_URL should be correctly formatted', () => {
    expect(API_BASE_URL).toBe('http://192.168.43.231:8000/api/v1');
    expect(API_BASE_URL).toContain('/api/v1');
  });

  test('STATIC_BASE_URL should be correctly formatted', () => {
    expect(STATIC_BASE_URL).toBe('http://192.168.43.231:8000');
    expect(STATIC_BASE_URL).not.toContain('/api/v1');
  });

  test('STORAGE_KEYS should have required keys', () => {
    expect(STORAGE_KEYS.TOKEN).toBe('auth_token');
    expect(STORAGE_KEYS.USER).toBe('user_data');
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(2);
  });

  test('API_BASE_URL and STATIC_BASE_URL should share the same host', () => {
    const apiHost = API_BASE_URL.split('/api/v1')[0];
    expect(apiHost).toBe(STATIC_BASE_URL);
  });
});