import { describe, expect, it } from 'vitest';
import { groupReactionsForTest } from './messages.test-utils.js';

describe('reaction grouping', () => {
  it('aggregates emoji counts and me flag', () => {
    const result = groupReactionsForTest(
      [
        { emoji: '👍', userId: 'u1' },
        { emoji: '👍', userId: 'u2' },
        { emoji: '🎉', userId: 'u1' },
      ],
      'u1',
    );
    expect(result).toEqual([
      { emoji: '👍', count: 2, me: true, userIds: ['u1', 'u2'] },
      { emoji: '🎉', count: 1, me: true, userIds: ['u1'] },
    ]);
  });
});
