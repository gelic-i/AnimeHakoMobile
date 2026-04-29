// api.test.ts - Unit tests for API utilities

const API_BASE_URL = 'http://192.168.43.231:8000/api/v1';
const STATIC_BASE_URL = 'http://192.168.43.231:8000';

const formatRating = (rating: any): string => {
  if (rating === null || rating === undefined) return '?';
  const num = typeof rating === 'string' ? parseFloat(rating) : rating;
  if (isNaN(num)) return '?';
  return num.toFixed(1);
};

const getFullImageUrl = (url: string): string => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/static')) {
    return `${STATIC_BASE_URL}${url}`;
  }

  return `${STATIC_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
};

describe('formatRating', () => {
  test('should return "?" for null', () => {
    expect(formatRating(null)).toBe('?');
  });

  test('should return "?" for undefined', () => {
    expect(formatRating(undefined)).toBe('?');
  });

  test('should return "?" for NaN', () => {
    expect(formatRating(NaN)).toBe('?');
  });

  test('should format number correctly', () => {
    expect(formatRating(8.5)).toBe('8.5');
    expect(formatRating(9.123)).toBe('9.1');
    expect(formatRating(10)).toBe('10.0');
  });

  test('should parse string number correctly', () => {
    expect(formatRating('8.5')).toBe('8.5');
    expect(formatRating('9.876')).toBe('9.9');
  });
});

describe('getFullImageUrl', () => {
  test('should return empty string for empty input', () => {
    expect(getFullImageUrl('')).toBe('');
  });

  test('should return http URLs as-is', () => {
    expect(getFullImageUrl('http://example.com/image.png')).toBe('http://example.com/image.png');
  });

  test('should return https URLs as-is', () => {
    expect(getFullImageUrl('https://example.com/image.png')).toBe('https://example.com/image.png');
  });

  test('should prepend STATIC_BASE_URL for /static paths', () => {
    expect(getFullImageUrl('/static/images/poster.png')).toBe(`${STATIC_BASE_URL}/static/images/poster.png`);
  });

  test('should prepend STATIC_BASE_URL for relative paths', () => {
    expect(getFullImageUrl('images/poster.png')).toBe(`${STATIC_BASE_URL}/images/poster.png`);
  });

  test('should prepend STATIC_BASE_URL for paths starting with /', () => {
    expect(getFullImageUrl('/uploads/cover.jpg')).toBe(`${STATIC_BASE_URL}/uploads/cover.jpg`);
  });
});

describe('API Endpoints', () => {
  const endpoints = {
    animeList: `${API_BASE_URL}/anime`,
    animeDetail: (id: number) => `${API_BASE_URL}/anime/${id}`,
    userAnime: `${API_BASE_URL}/user/anime`,
    favorites: (animeId: number) => `${API_BASE_URL}/user/favorites/${animeId}`,
    authLogin: `${API_BASE_URL}/auth/login`,
    authRegister: `${API_BASE_URL}/auth/register`,
  };

  test('anime list endpoint should be correct', () => {
    expect(endpoints.animeList).toBe(`${API_BASE_URL}/anime`);
  });

  test('anime detail endpoint should include id', () => {
    expect(endpoints.animeDetail(1)).toBe(`${API_BASE_URL}/anime/1`);
    expect(endpoints.animeDetail(123)).toBe(`${API_BASE_URL}/anime/123`);
  });

  test('favorites endpoint should include anime id', () => {
    expect(endpoints.favorites(1)).toBe(`${API_BASE_URL}/user/favorites/1`);
    expect(endpoints.favorites(42)).toBe(`${API_BASE_URL}/user/favorites/42`);
  });

  test('auth endpoints should be correct', () => {
    expect(endpoints.authLogin).toBe(`${API_BASE_URL}/auth/login`);
    expect(endpoints.authRegister).toBe(`${API_BASE_URL}/auth/register`);
  });
});