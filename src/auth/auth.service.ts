import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async register(body: { username: string; email: string; password: string }) {
    const user = this.usersRepository.create({
      username: body.username,
      email: body.email,
      password: body.password,
      role: 'CUSTOMER',
    });
    return this.usersRepository.save(user);
  }

  async login(body: { email: string; password: string }) {
    return this.usersRepository.findOne({
      where: { email: body.email },
    });
  }
}
