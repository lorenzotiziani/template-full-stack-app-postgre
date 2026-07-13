import bcrypt from 'bcrypt';
import { UserModel } from './user.model';
import { RefreshTokenModel } from '../../models/RefreshToken';
import { User, UserSafe } from '../entities/authEntity';
import { BadRequestError, NotFoundError } from '../../errors';

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UsersResponse {
  users: Omit<User, 'password'>[];
  total: number;
  page: number;
  totalPages: number;
}

export class UserService {
  static async getUserById(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await UserModel.findById(id);

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }



  static async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('Utente non trovato');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestError('Password attuale non corretta');
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestError('La nuova password deve essere diversa da quella attuale');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await UserModel.update(userId, { password: hashedNewPassword });

    await RefreshTokenModel.revokeByUserId(userId);
  }

  static async deleteUser(userId: number): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundError('Utente non trovato');
    }

    await UserModel.delete(userId);

    await RefreshTokenModel.revokeByUserId(userId);
  }

  static async getAllUsers(): Promise<UserSafe[]> {
    const users = await UserModel.findAll();
    return users
  }
}