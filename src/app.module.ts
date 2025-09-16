import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { KeepAliveService } from './common/keepAlive/keep-alive.service';
import { CoreModule } from './core/core.module';
import { HealthController } from './health/health.controller';
import { CoreController } from './core/core.controller';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, emailConfig],
      envFilePath: '.env',
    }),
    CoreModule,
    PrismaModule,
    UserModule,
    AuthModule,
    WebSocketModule,
  ],
  controllers: [HealthController, CoreController],
  providers: [KeepAliveService],
})
export class AppModule {}
