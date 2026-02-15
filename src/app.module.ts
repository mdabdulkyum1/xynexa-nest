import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { KeepAliveService } from './common/keepAlive/keep-alive.service';
import { CoreModule } from './core/core.module';
import { HealthController } from './health/health.controller';
import { CoreController } from './core/core.controller';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import emailConfig from './config/email.config';
import { TeamModule } from './modules/team/team.module';
import { BoardModule } from './modules/board/board.module';
import { DocumentModule } from './modules/document/document.module';
import { GroupMessageModule } from './modules/groupMessage/groupMessage.module';
import { HmsModule } from './modules/hms/hms.module';
import { MessageModule } from './modules/message/message.module';
import { PaymentModule } from './modules/payment/payment.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { OnlineModule } from './modules/online/online.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

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
    TeamModule,
    BoardModule,
    DocumentModule,
    GroupMessageModule,
    HmsModule,
    MessageModule,
    PaymentModule,
    WebhookModule,
    WebsocketModule,
    OnlineModule,
  ],
  controllers: [HealthController, CoreController],
  providers: [KeepAliveService],
})
export class AppModule {}
