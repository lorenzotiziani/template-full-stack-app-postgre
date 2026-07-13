import { RefreshToken } from '../api/entities/authEntity';
import { prisma } from '../config/prisma';

export class RefreshTokenModel {
  static async create(tokenData: Omit<RefreshToken, 'id' | 'createdAt'>): Promise<RefreshToken> {
    await prisma.refreshToken.deleteMany({
      where: { userId: tokenData.userId },
    });

    return await prisma.refreshToken.create({
      data: {
        token: tokenData.token,
        userId: tokenData.userId,
        expiresAt: tokenData.expiresAt,
        isRevoked: tokenData.isRevoked ?? false,
        createdAt: new Date(),
      },
    });
  }

  static async findByToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  static async revokeByUserId(userId: number): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  static async revokeByToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
      },
    });
  }
}
