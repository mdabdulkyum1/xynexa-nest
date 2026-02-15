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
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId: currentUser.id },
      include: {
        team: {
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
                    status: true,
                    lastActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Extract all members from these teams and unify them
    const uniqueMembersMap = new Map();

    teamMemberships.forEach((membership) => {
      membership.team.members.forEach((m) => {
        if (m.user && m.user.id !== currentUser.id) {
          const user = {
            _id: m.user.id, // mapped to _id for frontend compatibility
            id: m.user.id,
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            email: m.user.email,
            imageUrl: m.user.imageUrl,
            status: m.user.status,
            lastActive: m.user.lastActive,
          };
          uniqueMembersMap.set(m.user.id, user);
        }
      });
    });

    const uniqueMembers = Array.from(uniqueMembersMap.values());
    return { uniqueMembers };
  }
}
