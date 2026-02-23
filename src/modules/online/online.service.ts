import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnlineService {
  constructor(private prisma: PrismaService) {}

  async getOnlineUsers(userEmail: string) {
    if (!userEmail) {
      throw new NotFoundException('Email is required');
    }

    // Find current user's ID
    const currentUser = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Find teams where this user is a member
    const teams = await this.prisma.team.findMany({
      where: {
        memberIds: { has: currentUser.id },
      },
      include: {
        members: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            status: true,
            lastActive: true,
          },
        },
      },
    });

    // Extract all members from these teams and unify them
    const uniqueMembersMap = new Map();

    teams.forEach((team) => {
      team.members.forEach((m) => {
        if (m && m.id !== currentUser.id) {
          const user = {
            _id: m.id, // mapped to _id for frontend compatibility
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            imageUrl: m.imageUrl,
            status: m.status,
            lastActive: m.lastActive,
          };
          uniqueMembersMap.set(m.id, user);
        }
      });
    });

    const uniqueMembers = Array.from(uniqueMembersMap.values());
    return { uniqueMembers };
  }
}
