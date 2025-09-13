import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { CoreModule } from './core/core.module';
import { HealthController } from './health/health.controller';
import { CoreController } from './core/core.controller';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    CoreModule,
    PrismaModule,
    UserModule,
    AuthModule,
    WebSocketModule,
  ],
  controllers: [HealthController, CoreController],
  providers: [],
})
export class AppModule {}
