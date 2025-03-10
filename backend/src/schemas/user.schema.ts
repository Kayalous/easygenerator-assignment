import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDocument extends Document, TimestampFields {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  isActive: boolean;
  role: string;
  lastLoginAt?: Date;
}

@Schema({
  timestamps: true, // Automatically add createdAt and updatedAt fields
  versionKey: false, // Remove the __v field
})
export class User {
  @Prop({ required: true, minlength: 3 })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 'user' })
  role: string;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add index for email field for faster lookups
UserSchema.index({ email: 1 });

// Add index for role and isActive for faster filtering
UserSchema.index({ role: 1, isActive: 1 });
