// types.test.ts - Unit tests for types and constants

import { STATUS_LABELS } from '../types';

describe('STATUS_LABELS', () => {
  test('should have correct labels for all status values', () => {
    expect(STATUS_LABELS.watching).toBe('Смотрю');
    expect(STATUS_LABELS.completed).toBe('Просмотрено');
    expect(STATUS_LABELS.dropped).toBe('Брошено');
    expect(STATUS_LABELS.planned).toBe('Запланировано');
  });

  test('should have exactly 4 status values', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(4);
  });
});