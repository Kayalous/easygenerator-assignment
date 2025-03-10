import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsNotEmpty()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;
}

export class SignInDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class UserResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The user ID',
  })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  email: string;

  @ApiProperty({ example: false, description: 'Whether the email is verified' })
  @IsBoolean()
  emailVerified: boolean;

  @ApiProperty({ example: 'user', description: 'The user role' })
  role: string;

  @ApiProperty({
    example: '2024-03-19T12:00:00.000Z',
    description: 'When the user was created',
  })
  @IsDate()
  createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
