import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

// Hardcoded accounts
const HARDCODED_ACCOUNTS = [
  {
    email: 'lukas@gmail.com',
    password: 'user',
    username: 'lukas',
    role: 'CUSTOMER',
  },
  {
    email: 'admindot@admin.com',
    password: 'Admin',
    username: 'Admin DOT',
    role: 'ADMIN',
  },
];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(body: { username: string; email: string; password: string }) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: body.email }, { username: body.username }],
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = this.usersRepository.create({
      username: body.username,
      email: body.email,
      password: hashedPassword,
      role: 'CUSTOMER',
    });

    return this.usersRepository.save(user);
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    // Check hardcoded accounts first
    const hardcodedUser = HARDCODED_ACCOUNTS.find(
      (account) => account.email === email && account.password === password,
    );

    if (hardcodedUser) {
      return {
        success: true,
        user: {
          id: 0,
          username: hardcodedUser.username,
          email: hardcodedUser.email,
          role: hardcodedUser.role,
        },
      };
    }

    // Check database users
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
