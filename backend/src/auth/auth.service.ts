import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import {
  SignUpDto,
  SignInDto,
  AuthResponseDto,
  UserResponseDto,
} from './dto/auth.dto';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private createUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: (user._id as Types.ObjectId).toString(),
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async signup(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { name, email, password } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await this.userModel.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      isActive: true,
      role: 'user',
    });

    // Generate JWT token
    const payload: JwtPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    return {
      token,
      user: this.createUserResponse(user),
    };
  }

  async signin(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Find user
    const user = await this.userModel.findOne({ email, isActive: true }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const payload: JwtPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn'),
    });

    return {
      token,
      user: this.createUserResponse(user),
    };
  }
}
