// auth.test.ts - Unit tests for authentication utilities

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const createAuthHeaders = (token: string | null): HeadersInit => {
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const isTokenValid = (token: string | null | undefined): boolean => {
  return !!token && token.length > 0;
};

const parseAuthError = (errorResponse: any): string => {
  if (errorResponse?.detail) {
    return errorResponse.detail;
  }
  if (errorResponse?.message) {
    return errorResponse.message;
  }
  return 'Unknown error';
};

describe('createAuthHeaders', () => {
  test('should return empty object for null token', () => {
    const headers = createAuthHeaders(null);
    expect(headers).toEqual({});
  });

  test('should return empty object for undefined token', () => {
    const headers = createAuthHeaders(undefined);
    expect(headers).toEqual({});
  });

  test('should return empty object for empty string token', () => {
    const headers = createAuthHeaders('');
    expect(headers).toEqual({});
  });

  test('should include Authorization header for valid token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const headers = createAuthHeaders(token);
    expect(headers).toEqual({
      Authorization: `Bearer ${token}`,
    });
  });
});

describe('isTokenValid', () => {
  test('should return false for null', () => {
    expect(isTokenValid(null)).toBe(false);
  });

  test('should return false for undefined', () => {
    expect(isTokenValid(undefined)).toBe(false);
  });

  test('should return false for empty string', () => {
    expect(isTokenValid('')).toBe(false);
  });

  test('should return true for non-empty token', () => {
    expect(isTokenValid('valid_token_string')).toBe(true);
    expect(isTokenValid('eyJhbGciOiJIUzI1NiJ9')).toBe(true);
  });
});

describe('parseAuthError', () => {
  test('should extract detail from error response', () => {
    const error = { detail: 'Invalid credentials' };
    expect(parseAuthError(error)).toBe('Invalid credentials');
  });

  test('should extract message from error response', () => {
    const error = { message: 'User not found' };
    expect(parseAuthError(error)).toBe('User not found');
  });

  test('should return "Unknown error" for empty object', () => {
    expect(parseAuthError({})).toBe('Unknown error');
  });

  test('should return "Unknown error" for null', () => {
    expect(parseAuthError(null)).toBe('Unknown error');
  });
});

describe('Auth Storage Keys', () => {
  test('TOKEN_KEY should be auth_token', () => {
    expect(TOKEN_KEY).toBe('auth_token');
  });

  test('USER_KEY should be user_data', () => {
    expect(USER_KEY).toBe('user_data');
  });
});