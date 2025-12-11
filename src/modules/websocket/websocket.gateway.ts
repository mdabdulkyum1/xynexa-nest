
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { BoardService } from '../board/board.service';
import { MessageService } from '../message/message.service';
import { UserService } from '../user/user.service';

interface JoinPayload {
  email: string;
}

interface UserOfflinePayload {
  email: string;
}

type UserId = string;

interface PrivateMessagePayload {
  senderId: string;
  receiverId: string; // userId room
  text?: string;
  // any other fields required by your client
}

interface TypingPayload {
  senderId: string;
  receiverId: string;
}

interface MessageReadPayload {
  _id: string;
  receiverId: string;
}

interface DeleteMessagePayload {
  messageId: string;
  receiverId: string;
}

interface JoinGroupPayload {
  groupId: string;
}

interface GroupMessagePayload {
  senderId: string;
  groupId: string;
  newMessage: string;
  messageId?: string;
}

interface UpdateTaskStatusPayload {
  boardId: string;
  newStatus: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public io: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  // email -> socketId
  private onlineEmails = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
    private readonly boardService: BoardService,
  ) {}

  private broadcastOnlineEmails(): void {
    const emails = Array.from(this.onlineEmails.keys());
    this.io.emit('online-users', emails);
  }

  // Called when client connects (no DB ops here to keep connection fast)
  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // Called when socket disconnects
  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client disconnected: ${client.id}`);

    let disconnectedEmail: string | null = null;

    for (const [email, sId] of this.onlineEmails.entries()) {
      if (sId === client.id) {
        disconnectedEmail = email;
        this.onlineEmails.delete(email);
        client.leave(email);
        break;
      }
    }

    if (!disconnectedEmail) return;

    try {
      // use userService (which should wrap Prisma calls)
      await this.userService.updateByEmail(disconnectedEmail, {
        status: 'Offline',
        lastActive: new Date(),
      });

      this.io.emit('user-online-status', {
        email: disconnectedEmail,
        status: 'Offline',
      });

      this.broadcastOnlineEmails();
    } catch (err: unknown) {
      this.logger.error('Error updating user status on disconnect', err as any);
    }
  }

  /* =======================
     1. USER JOIN / ONLINE (email)
     ======================= */
  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() payload: JoinPayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const { email } = payload ?? {};
    if (!email) return;

    socket.join(email);
    this.onlineEmails.set(email, socket.id);

    this.logger.log(`User ${email} is ONLINE`);

    try {
      await this.userService.updateByEmail(email, {
        status: 'Online',
        lastActive: new Date(),
      });

      this.io.emit('user-online-status', { email, status: 'Online' });
      this.broadcastOnlineEmails();
    } catch (err: unknown) {
      this.logger.error('Error updating user status to Online', err as any);
    }
  }

  /* =======================
     2. USER OFFLINE (manual logout)
     ======================= */
  @SubscribeMessage('user-offline')
  async handleUserOffline(
    @MessageBody() payload: UserOfflinePayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const { email } = payload ?? {};
    if (!email) return;

    this.onlineEmails.delete(email);
    socket.leave(email);

    this.logger.log(`User ${email} went OFFLINE (logout)`);

    try {
      await this.userService.updateByEmail(email, {
        status: 'Offline',
        lastActive: new Date(),
      });

      this.io.emit('user-online-status', { email, status: 'Offline' });
      this.broadcastOnlineEmails();
    } catch (err: unknown) {
      this.logger.error('Error updating user status to Offline', err as any);
    }
  }

  /* =======================
     3. JOIN / LEAVE USER ROOM (private)
     ======================= */
  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody() userId: UserId,
    @ConnectedSocket() socket: Socket,
  ): void {
    if (!userId) return;
    socket.join(userId);
    this.logger.log(`User joined private room: ${userId}`);
  }

  @SubscribeMessage('leaveUserRoom')
  handleLeaveUserRoom(
    @MessageBody() userId: UserId,
    @ConnectedSocket() socket: Socket,
  ): void {
    if (!userId) return;
    socket.leave(userId);
    this.logger.log(`User left private room: ${userId}`);
  }

  /* =======================
     4. PRIVATE CHAT (userId based)
     ======================= */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() message: PrivateMessagePayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const { receiverId } = message;
    if (!receiverId) return;

    // Optionally persist:
    try {
      // await to satisfy linter and ensure persistence
      await this.messageService.create({
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text ?? '',
      });
    } catch (err: unknown) {
      this.logger.error('Error saving message', err as any);
      // continue to emit even if DB fails (optional)
    }

    // Emit to receiver room (receiverId should be the room name you use)
    this.io.to(receiverId).emit('receiveMessage', message);
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() payload: TypingPayload): void {
    const { senderId, receiverId } = payload;
    if (receiverId) this.io.to(receiverId).emit('typing', { senderId });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(@MessageBody() payload: { receiverId: string }): void {
    const { receiverId } = payload;
    if (receiverId) this.io.to(receiverId).emit('stopTyping');
  }

  @SubscribeMessage('messageRead')
  async handleMessageRead(
    @MessageBody() payload: MessageReadPayload,
  ): Promise<void> {
    const { _id: messageId, receiverId } = payload;
    if (!messageId) return;

    try {
      const updated = await this.messageService.markRead(messageId);
      if (updated && receiverId) {
        this.io.to(receiverId).emit('messageRead', { id: messageId });
      }
    } catch (err: unknown) {
      this.logger.error('Error marking message as read', err as any);
    }
  }

  @SubscribeMessage('deleteMessage')
  handleDeleteMessage(@MessageBody() payload: DeleteMessagePayload): void {
    const { messageId, receiverId } = payload;
    if (!messageId || !receiverId) return;
    this.io.to(receiverId).emit('messageDeleted', { messageId });
  }

  /* =======================
     5. GROUP CHAT
     ======================= */
  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @MessageBody() payload: JoinGroupPayload,
    @ConnectedSocket() socket: Socket,
  ): void {
    const { groupId } = payload ?? {};
    if (!groupId) return;
    socket.join(groupId);
    this.logger.log(`User joined group: ${groupId}`);
  }

  @SubscribeMessage('sentGroupMessage')
  async handleSentGroupMessage(
    @MessageBody() body: GroupMessagePayload,
  ): Promise<void> {
    const { senderId, groupId, newMessage, messageId } = body;
    if (!groupId || !senderId || !newMessage) return;

    try {
      // fetch sender display info
      const sender = await this.userService.findById(senderId);
      if (!sender) return;

      const populatedMsg = {
        _id: messageId ?? undefined,
        senderId: {
          _id: sender.id,
          firstName: sender.firstName,
          email: sender.email,
          imageUrl: sender.imageUrl,
        },
        groupId,
        message: newMessage,
        timestamp: new Date().toISOString(),
      };

      // Optionally save group message with your service (await)
      // await this.messageService.createGroupMessage({ ... })

      this.io.to(groupId).emit('receiveGroupMessage', populatedMsg);
    } catch (err: unknown) {
      this.logger.error('Error sending group message', err as any);
    }
  }

  /* =======================
     6. BOARD STATUS UPDATE
     ======================= */
  @SubscribeMessage('update-task-status')
  async handleUpdateTaskStatus(
    @MessageBody() payload: UpdateTaskStatusPayload,
  ): Promise<void> {
    const { boardId, newStatus } = payload;
    if (!boardId) return;

    try {
      const updatedBoard = await this.boardService.updateStatus(boardId, newStatus);

      if (!updatedBoard) return;

      // expect updatedBoard.members to be an array of member objects with `id` or `_id`
      for (const member of updatedBoard.members as Array<{ id?: string; _id?: string }>) {
        const memberId = (member.id ?? member._id) as string;
        if (memberId) {
          this.io.to(memberId).emit('boardStatusUpdated', updatedBoard);
        }
      }
    } catch (err: unknown) {
      this.logger.error('Error updating board status', err as any);
    }
  }
}
