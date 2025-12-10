import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { HmsService } from './hms.service';
import { CreateHmsDto, HmsResponseDto } from './dto/hms.dto';

@Controller('hms')
export class HmsController {
  constructor(private readonly hmsService: HmsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createHms(@Body() createHmsDto: CreateHmsDto): Promise<HmsResponseDto> {
    return this.hmsService.createHms(createHmsDto);
  }

  @Get()
  async getAllHms(): Promise<HmsResponseDto[]> {
    return this.hmsService.getAllHms();
  }
}
