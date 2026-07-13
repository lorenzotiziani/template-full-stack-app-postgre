import { User, UserSafe } from '../entities/authEntity';
import { prisma } from '../../config/prisma';


export class UserModel {
  static async findById(id: number): Promise<User | null> {
    return await prisma.tUtente.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await prisma.tUtente.findFirst({
      where: { email },
    });
  }

  static async create(userData: Omit<User, 'id'>): Promise<User> {
    return await prisma.tUtente.create({
      data: userData,
    });
  }

  static async update(id: number, userData: Partial<User>): Promise<User | null> {
    try {
      return await prisma.tUtente.update({
        where: { id },
        data: userData,
      });
    } catch (error) {
      // Se l'utente non esiste Prisma lancia errore
      return null;
    }
  }

  static async findAll(): Promise<UserSafe[]> {
    return await prisma.tUtente.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        id: true,
        email: true,
        nome: true,
        cognome: true,
        isActive: true,
      },
    });
  }

  // Metodo per verificare se un'email esiste (escludendo un utente specifico)
  static async isEmailTaken(email: string, excludeUserId?: number): Promise<boolean> {
    const count = await prisma.tUtente.count({
      where: {
        email,
        isActive: true,
        ...(excludeUserId && {
          id: { not: excludeUserId },
        }),
      },
    });

    return count > 0;
  }

  static async delete(id: number): Promise<void> {
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({
        where: { userId: id },
      }),
      prisma.tUtente.delete({
        where: { id },
      }),
    ]);
  }
}
