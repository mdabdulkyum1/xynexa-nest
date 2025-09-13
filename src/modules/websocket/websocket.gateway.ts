import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: '/ws',
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger(WebSocketGatewayService.name);
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        this.logger.warn(`Invalid user for client ${client.id}`);
        client.disconnect();
        return;
      }

      client.userId = payload.sub;
      client.userEmail = payload.email;
      this.connectedClients.set(client.id, client);

      // Join user to their personal room
      client.join(`user_${client.userId}`);

      this.logger.log(
        `Client ${client.id} connected as user ${client.userEmail}`,
      );

      // Emit connection success
      client.emit('connected', {
        message: 'Connected to WebSocket successfully',
        userId: client.userId,
      });

      // Broadcast to others that user is online
      client.broadcast.emit('userOnline', {
        userId: client.userId,
        email: client.userEmail,
      });
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);

    if (client.userId) {
      // Broadcast that user is offline
      client.broadcast.emit('userOffline', {
        userId: client.userId,
        email: client.userEmail,
      });
    }

    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { content: string; to?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`Message from ${client.userEmail}: ${data.content}`);

    // If 'to' is specified, send to specific user
    if (data.to) {
      this.server.to(`user_${data.to}`).emit('message', {
        from: client.userId,
        fromEmail: client.userEmail,
        content: data.content,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Broadcast to all connected clients
      this.server.emit('message', {
        from: client.userId,
        fromEmail: client.userEmail,
        content: data.content,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(data.room);
    client.emit('joinedRoom', { room: data.room });
    this.logger.log(`Client ${client.id} joined room: ${data.room}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(data.room);
    client.emit('leftRoom', { room: data.room });
    this.logger.log(`Client ${client.id} left room: ${data.room}`);
  }

  @SubscribeMessage('roomMessage')
  handleRoomMessage(
    @MessageBody() data: { room: string; content: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.server.to(data.room).emit('roomMessage', {
      room: data.room,
      from: client.userId,
      fromEmail: client.userEmail,
      content: data.content,
      timestamp: new Date().toISOString(),
    });
  }

  // Helper method to send notification to specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  // Helper method to broadcast to all users
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.connectedClients.size;
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    return token || null;
  }
}
