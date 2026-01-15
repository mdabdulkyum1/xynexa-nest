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
import axios from 'axios';

interface CreateRoomPayload {
  name?: string;
  timestamp?: string;
}

interface JoinRoomPayload {
  roomId: string;
  userData: {
    name?: string;
    email?: string;
    photo?: string;
    [key: string]: any;
  };
}

interface SentMessagePayload {
  room: string;
  message: string;
  senderName: string;
  senderEmail: string;
  photo?: string;
  receiverName?: string;
}

interface RoomUser {
  socketId: string;
  name?: string;
  email?: string;
  photo?: string;
  [key: string]: any;
}

@Injectable()
@WebSocketGateway({
  namespace: '/meet',
  cors: {
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class HmsMeetGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public io: Server;

  private readonly logger = new Logger(HmsMeetGateway.name);

  // roomCode -> roomId (100ms room ID)
  private roomCodeToIdMap: Record<string, string> = {};
  // roomCode -> array of users
  private roomUsers: Record<string, RoomUser[]> = {};

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log(`HMS Meet client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`HMS Meet client disconnected: ${client.id}`);

    // Clean up user from all rooms
    for (const roomId in this.roomUsers) {
      this.roomUsers[roomId] = this.roomUsers[roomId].filter(
        (user) => user.socketId !== client.id,
      );

      // If room is empty, clean up mapping
      if (this.roomUsers[roomId].length === 0) {
        delete this.roomUsers[roomId];
        delete this.roomCodeToIdMap[roomId];
      } else {
        // Notify remaining users
        this.io.to(roomId).emit('updatedRoomUser', this.roomUsers[roomId]);
      }
    }
  }

  /* =======================
     CREATE ROOM (100ms)
     ======================= */
  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() userData: CreateRoomPayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      // Create 100ms room
      const roomResponse = await axios.post(
        'https://api.100ms.live/v2/rooms',
        {
          name: `room-${socket.id}-${Date.now()}`,
          description: 'Dynamic room for Xynexa',
          template_id: process.env.HMS_TEMPLATE_ID,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`,
          },
        },
      );

      const roomId = roomResponse.data.id; // 100ms room id

      // Generate room code
      const roomCodeResponse = await axios.post(
        `https://api.100ms.live/v2/room-codes/room/${roomId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const roomCode =
        roomCodeResponse.data.data.find((code: any) => code.enabled)?.code;

      if (!roomCode) {
        socket.emit('RoomCreationError', 'Failed to generate room code');
        return;
      }

      // Store mapping of roomCode to roomId
      this.roomCodeToIdMap[roomCode] = roomId;

      socket.join(roomCode);
      this.roomUsers[roomCode] = [{ socketId: socket.id, ...userData }];

      const { name, timestamp } = userData;
      socket.emit('RoomCreated', roomCode, name, timestamp);
    } catch (error: any) {
      this.logger.error('Error creating 100ms room:', error);
      socket.emit('RoomCreationError', 'Failed to create room');
    }
  }

  /* =======================
     JOIN ROOM
     ======================= */
  @SubscribeMessage('JoinRoom')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    try {
      const { roomId, userData } = payload;
      // roomId here is actually the roomCode
      const actualRoomId = this.roomCodeToIdMap[roomId]; // Get the actual room_id

      if (!actualRoomId) {
        socket.emit('RoomJoinError', 'Invalid room code');
        return;
      }

      // Check if the room exists in 100ms
      const roomResponse = await axios.get(
        `https://api.100ms.live/v2/rooms/${actualRoomId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.HMS_MANAGEMENT_TOKEN}`,
          },
        },
      );

      if (!roomResponse.data.id) {
        socket.emit('RoomJoinError', 'Room not found');
        return;
      }

      socket.join(roomId); // Join the socket room using roomCode
      if (!this.roomUsers[roomId]) {
        this.roomUsers[roomId] = [];
      }
      this.roomUsers[roomId].push({ socketId: socket.id, ...userData });
      socket.emit('RoomJoined', roomId);
      this.io.to(roomId).emit('updatedRoomUser', this.roomUsers[roomId]);
    } catch (error: any) {
      this.logger.error('Error joining room:', error);
      socket.emit('RoomJoinError', 'Failed to join room');
    }
  }

  /* =======================
     GET ROOM USERS
     ======================= */
  @SubscribeMessage('getRoomUsers')
  handleGetRoomUsers(
    @MessageBody() roomId: string,
    @ConnectedSocket() socket: Socket,
  ): void {
    if (this.roomUsers[roomId]) {
      socket.emit('updatedRoomUser', this.roomUsers[roomId]);
    } else {
      socket.emit('updatedRoomUser', []);
    }
  }

  /* =======================
     SEND MESSAGE (HMS Room)
     ======================= */
  @SubscribeMessage('sentMessage')
  async handleSentMessage(
    @MessageBody() payload: SentMessagePayload,
    @ConnectedSocket() socket: Socket,
  ): Promise<void> {
    const { room, message, senderName, senderEmail, photo, receiverName } =
      payload;

    const messageData = {
      room,
      message,
      photo,
      senderName,
      senderEmail,
      receiverName,
      timestamp: new Date(),
    };

    // Emit to room (old server emits to room)
    this.io.to(room).emit('receiveMessage', {
      sender: socket.id,
      senderName,
      photo,
      message,
    });

    // Note: Old server saves to MongoDB collection 'messages'
    // If you need to persist, you can add a service call here
    // await this.messageService.createHmsMessage(messageData);
  }
}

