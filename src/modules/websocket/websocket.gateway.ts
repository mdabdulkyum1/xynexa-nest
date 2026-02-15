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
import { BoardStatus } from '@prisma/client';

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
  content: string;
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
  // userId -> socketId (for tracking user connections)
  private userConnections = new Map<string, string>();

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
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  // Called when socket disconnects
  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`❌ Client disconnected: ${client.id}`);

    let disconnectedEmail: string | null = null;
    let disconnectedUserId: string | null = null;

    // Find and remove from email map
    for (const [email, sId] of this.onlineEmails.entries()) {
      if (sId === client.id) {
        disconnectedEmail = email;
        this.onlineEmails.delete(email);
        client.leave(email);
        break;
      }
    }

    // Find and remove from user connections map
    for (const [userId, sId] of this.userConnections.entries()) {
      if (sId === client.id) {
        disconnectedUserId = userId;
        this.userConnections.delete(userId);
        client.leave(userId);
        break;
      }
    }

    if (!disconnectedEmail) return;

    try {
      // Update user status to offline
      await this.userService.updateByEmail(disconnectedEmail, {
        status: 'Offline',
        lastActive: new Date(),
      });

      // Broadcast offline status immediately
      this.io.emit('user-online-status', {
        email: disconnectedEmail,
        status: 'Offline',
      });

      this.broadcastOnlineEmails();
      this.logger.log(`🔴 User ${disconnectedEmail} is now OFFLINE`);
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

    this.logger.log(`🟢 User ${email} is ONLINE`);

    try {
      await this.userService.updateByEmail(email, {
        status: 'Online',
        lastActive: new Date(),
      });

      // Broadcast online status immediately to all clients
      this.io.emit('user-online-status', { email, status: 'Online' });
      this.broadcastOnlineEmails();

      // Send acknowledgment to the connecting client
      socket.emit('join-confirmed', { 
        email, 
        status: 'Online',
        timestamp: new Date().toISOString() 
      });
    } catch (err: unknown) {
      this.logger.error('Error updating user status to Online', err as any);
      socket.emit('join-error', { message: 'Failed to update online status' });
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

    this.logger.log(`🔴 User ${email} went OFFLINE (manual)`);

    try {
      await this.userService.updateByEmail(email, {
        status: 'Offline',
        lastActive: new Date(),
      });

      // Broadcast offline status immediately
      this.io.emit('user-online-status', { email, status: 'Offline' });
      this.broadcastOnlineEmails();

      // Send acknowledgment
      socket.emit('offline-confirmed', { 
        email, 
        status: 'Offline',
        timestamp: new Date().toISOString() 
      });
    } catch (err: unknown) {
      this.logger.error('Error updating user status to Offline', err as any);
    }
  }

  /* =======================
     3. JOIN / LEAVE USER ROOM (private)
     ======================= */
  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(
    @MessageBody() payload: { userId: string } | string,
    @ConnectedSocket() socket: Socket,
  ): void {
    // Handle both object and string payload
    const userId = typeof payload === 'string' ? payload : payload?.userId;

    if (!userId) {
        this.logger.error(`❌ Join user room failed: Invalid payload ${JSON.stringify(payload)}`);
        return;
    }

    socket.join(userId);
    this.userConnections.set(userId, socket.id);
    this.logger.log(`👤 User joined private room: "${userId}"`);
    
    // Send acknowledgment
    socket.emit('user-room-joined', { userId });
  }

  @SubscribeMessage('leaveUserRoom')
  handleLeaveUserRoom(
    @MessageBody() userId: UserId,
    @ConnectedSocket() socket: Socket,
  ): void {
    if (!userId) return;
    socket.leave(userId);
    this.userConnections.delete(userId);
    this.logger.log(`👤 User left private room: ${userId}`);
  }

  /* =======================
     4. PRIVATE CHAT (userId based)
     ======================= */
  
  // Public method for REST API to trigger event
  public notifyMessageCreated(message: any): void {
    const { receiverId } = message;
    if (!receiverId) return;

    // Emit message to receiver
    this.io.to(receiverId).emit('receiveMessage', message);
    this.logger.log(`📨 API Message delivered to receiver: ${receiverId}`);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody() message: PrivateMessagePayload,
    @ConnectedSocket() socket: Socket,
  ): void {
    const { receiverId, senderId } = message;
    if (!receiverId) return;

    // Emit message to receiver
    this.io.to(receiverId).emit('receiveMessage', message);

    // Check if receiver is online and send delivery confirmation
    const isReceiverOnline = this.userConnections.has(receiverId);
    
    if (isReceiverOnline) {
   
      const msgId = (message as any).id || (message as any)._id;
      
      socket.emit('message-delivered', { 
        messageId: msgId,
        receiverId,
        deliveredAt: new Date().toISOString()
      });
      
      this.logger.log(`📨 Message delivered to ${receiverId}`);
    } else {
      this.logger.log(`📭 Message queued for ${receiverId} (offline)`);
    }
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
    this.logger.log(`👥 User joined group: ${groupId}`);
  }

  @SubscribeMessage('sentGroupMessage')
  async handleSentGroupMessage(
    @MessageBody() body: any,
  ): Promise<void> {
    // Accept both 'content' and 'newMessage' for backward compatibility
    // xynexa-server uses 'newMessage', xynexa-nest uses 'content'
    const content = body.content || body.newMessage;
    const { senderId, groupId, messageId } = body;
    
    if (!groupId || !senderId || !content) return;

    try {
      // fetch sender display info (same as old server)
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
        content: content,
        createdAt: new Date().toISOString(),
      };

      // Old server doesn't save group messages in socket handler
      // They are saved via HTTP endpoint (sendGroupMessage controller)
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
      // Update board status and get full board with populated members (like old server)
      const updatedBoard = await this.prisma.board.update({
        where: { id: boardId },
        data: { status: newStatus as BoardStatus, updatedAt: new Date() },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                },
              },
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                },
              },
            },
          },
          attachments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      if (!updatedBoard) return;

      // Emit to each member's userId (old server uses member._id.toString())
      updatedBoard.members.forEach((member) => {
        const memberId = member.user.id;
        if (memberId) {
          this.io.to(memberId).emit('boardStatusUpdated', updatedBoard);
        }
      });
    } catch (err: unknown) {
      this.logger.error('Error updating board status', err as any);
    }
  }

  /* =======================
     7. HEARTBEAT / CONNECTION HEALTH
     ======================= */
  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() socket: Socket): void {
    socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
  }
}
