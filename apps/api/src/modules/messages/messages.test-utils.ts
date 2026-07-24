import type { ReactionDto } from '@pulse/shared';

export function groupReactionsForTest(
  reactions: Array<{ emoji: string; userId: string }>,
  currentUserId: string,
): ReactionDto[] {
  const map = new Map<string, ReactionDto>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(r.userId);
      if (r.userId === currentUserId) existing.me = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        me: r.userId === currentUserId,
        userIds: [r.userId],
      });
    }
  }
  return [...map.values()];
}
