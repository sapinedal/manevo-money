import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, IsISO8601, IsPositive } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsISO8601()
  date: string;

  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsOptional()
  toAccountId?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  color?: string;
}
