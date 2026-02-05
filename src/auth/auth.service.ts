import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

const HARDCODED_ACCOUNTS = [
  {
    email: 'lukas@gmail.com',
    password: 'user',
    username: 'lukas',
    role: 'CUSTOMER',
    balance: 500000,
  },
  {
    email: 'admindot@admin.com',
    password: 'Admin',
    username: 'Admin DOT',
    role: 'ADMIN',
    balance: 0,
  },
];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(body: { username: string; email: string; password: string }) {
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: body.email }, { username: body.username }],
    });

    if (existingUser) {
      throw new Error('User dengan email atau username tersebut sudah ada.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = this.usersRepository.create({
      username: body.username,
      email: body.email,
      password: hashedPassword,
      role: 'CUSTOMER',
      balance: 0,
    });

    return this.usersRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    // Check hardcoded accounts first
    const hardcodedUser = HARDCODED_ACCOUNTS.find(
      (account) => account.email === email && account.password === password,
    );

    if (hardcodedUser) {
      // Check if hardcoded user already exists in database
      let dbUser = await this.usersRepository.findOne({
        where: { email: hardcodedUser.email },
      });

      // If not, create user in database
      if (!dbUser) {
        const hashedPassword = await bcrypt.hash(hardcodedUser.password, 10);
        dbUser = this.usersRepository.create({
          username: hardcodedUser.username,
          email: hardcodedUser.email,
          password: hashedPassword,
          role: hardcodedUser.role,
          balance: hardcodedUser.balance,
        });
        dbUser = await this.usersRepository.save(dbUser);
        console.log('[AUTH] Created hardcoded user in DB:', dbUser.id, dbUser.email);
      }

      return {
        success: true,
        user: {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          role: dbUser.role,
          balance: Number(dbUser.balance) || 0,
        },
      };
    }

    // Check database users
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Email atau kata sandi tidak valid' };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Email atau kata sandi tidak valid' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        balance: Number(user.balance) || 0,
      },
    };
  }

  async topUp(userId: number, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
    if (amount <= 0) {
      return { success: false, error: 'Jumlah top up harus lebih dari 0' };
    }

    if (amount > 10000000) {
      return { success: false, error: 'Maksimal top up Rp 10.000.000 per transaksi' };
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const currentBalance = Number(user.balance) || 0;
    const newBalance = currentBalance + amount;

    await this.usersRepository.update(userId, { balance: newBalance });

    return { success: true, balance: newBalance };
  }

  async getBalance(userId: number): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return user ? Number(user.balance) || 0 : 0;
  }

  async deductBalance(userId: number, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const currentBalance = Number(user.balance) || 0;

    if (currentBalance < amount) {
      return { success: false, error: 'Saldo tidak mencukupi' };
    }

    const newBalance = currentBalance - amount;
    await this.usersRepository.update(userId, { balance: newBalance });

    return { success: true, balance: newBalance };
  }

  async refundBalance(userId: number, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      return { success: false, error: 'User tidak ditemukan' };
    }

    const currentBalance = Number(user.balance) || 0;
    const newBalance = currentBalance + amount;

    await this.usersRepository.update(userId, { balance: newBalance });

    return { success: true, balance: newBalance };
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
