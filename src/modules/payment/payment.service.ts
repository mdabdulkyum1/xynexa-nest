/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  createPayment(
    _createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Payment creation not implemented yet');
  }

  getUserPayments(_userId: string): Promise<PaymentResponseDto[]> {
    // Implementation will be added later
    throw new NotImplementedException('Get user payments not implemented yet');
  }

  updatePayment(
    _id: string,
    _updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('Payment update not implemented yet');
  }
}
