import { Controller, Get } from '@nestjs/common';
import { CoreService } from './core.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('core')
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @Public()
  @Get('info')
  getAppInfo() {
    const info = this.coreService.getAppInfo();
    return this.coreService.formatResponse(
      info,
      'Application info retrieved successfully',
    );
  }
}
