import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/schemas/user.schema';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

interface MockModel {
  findOne: jest.Mock;
  create: jest.Mock;
}

interface MockQuery {
  exec: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let userModel: MockModel;
  let mockQuery: MockQuery;

  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@test.com',
    name: 'Test User',
    password: 'Password123!',
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockQuery = {
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn().mockReturnValue(mockQuery),
            create: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userModel = module.get<MockModel>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new user', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      mockQuery.exec.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
      });

      const result = await service.signup(mockUser);
      expect(result).toHaveProperty('token');
      expect(userModel.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user exists', async () => {
      mockQuery.exec.mockResolvedValue(mockUser);

      await expect(service.signup(mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('signin', () => {
    it('should return token when credentials are valid', async () => {
      const hashedPassword = await bcrypt.hash(mockUser.password, 10);
      mockQuery.exec.mockResolvedValue({
        ...mockUser,
        password: hashedPassword,
        save: jest.fn().mockResolvedValue(true),
      });

      const result = await service.signin({
        email: mockUser.email,
        password: mockUser.password,
      });

      expect(result).toHaveProperty('token');
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockQuery.exec.mockResolvedValue(null);

      const loginAttempt = async () => {
        return await service.signin({
          email: mockUser.email,
          password: mockUser.password,
        });
      };

      await expect(loginAttempt()).rejects.toThrow(UnauthorizedException);
    });
  });
});
