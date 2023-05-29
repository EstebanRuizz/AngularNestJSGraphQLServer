import * as bcrypt from 'bcrypt';
import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/input/create-user-input.dto';
import { GetUserArgs } from './dto/args/get-user-args.dto';
import { UsersRepository } from './users.repository';
import { UserDocument } from './models/user.schema';
import { User } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(createUserData: CreateUserInput) {
    await this.validateCreateUserData(createUserData);
    const userDocument = await this.usersRepository.create({
      ...createUserData,
      password: await bcrypt.hash(createUserData.password, 10),
    });
    return this.toModel(userDocument);
  }

  private async validateCreateUserData(createUserData: CreateUserInput) {
    try {
      const existingUser = await this.usersRepository.findOne({
        email: createUserData.email,
      });
      if (existingUser) {
        throw new UnprocessableEntityException('Email already exists.');
      }
    } catch (error) {}
  }

  async getUser(getUserArgs: GetUserArgs) {
    const userDocument = await this.usersRepository.findOne(getUserArgs);
    return this.toModel(userDocument);
  }

  async validateUser(email: string, password: string) {
    const userDocument = await this.usersRepository.findOne({ email });
    const passwordIsValid: boolean = await bcrypt.compare(
      password,
      userDocument.password,
    );
    if (passwordIsValid) {
      throw new UnauthorizedException('Credential are not valid');
    }
    return this.toModel(userDocument);
  }

  private toModel(userDocument: UserDocument): User {
    return {
      _id: userDocument._id.toHexString(),
      email: userDocument.email,
    };
  }
}
