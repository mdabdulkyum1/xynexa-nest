import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsMongoId,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsMongoId()
  @IsNotEmpty()
  userId!: string;
}

export class UpdatePaymentDto {
  @IsString()
  @IsOptional()
  status?: string;
}

export class PaymentResponseDto {
  id!: string;
  amount!: number;
  currency!: string;
  userId!: string;
  status!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
