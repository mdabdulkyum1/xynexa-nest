/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHmsDto, HmsResponseDto } from './dto/hms.dto';

@Injectable()
export class HmsService {
  constructor(private prisma: PrismaService) {}

  createHms(_createHmsDto: CreateHmsDto): Promise<HmsResponseDto> {
    // Implementation will be added later
    throw new NotImplementedException('HMS creation not implemented yet');
  }

  getAllHms(): Promise<HmsResponseDto[]> {
    // Implementation will be added later
    throw new NotImplementedException('Get all HMS not implemented yet');
  }
}
