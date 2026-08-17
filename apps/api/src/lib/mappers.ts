import type { User } from '@prisma/client';
import type { UserDto } from '@pulse/shared';

/** Prisma User → public DTO without passwordHash */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    statusMessage: user.statusMessage,
    createdAt: user.createdAt.toISOString(),
  };
}
