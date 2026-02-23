import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddMemberDto,
  TeamResponseDto,
  FormattedTeamDto,
} from './dto/team.dto';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  async createTeam(createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
    try {
      const { teamName, teamDescription, teamType, creator } = createTeamDto;

      // Create team and add creator as first member
      const team = await this.prisma.team.create({
        data: {
          name: teamName,
          description: teamDescription,
          type: teamType,
          creatorId: creator,
          memberIds: [creator],
        },
        include: {
          creator: true,
          members: true,
        },
      });

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        creatorId: team.creatorId,
        createdAt: team.createdAt,
        creator: team.creator,
        members: team.members,
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw new InternalServerErrorException('Failed to create team');
    }
  }

  async getTeamById(id: string): Promise<TeamResponseDto> {
    try {
      const team = await this.prisma.team.findUnique({
        where: { id },
        include: {
          creator: true,
          members: true,
        },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        creatorId: team.creatorId,
        createdAt: team.createdAt,
        creator: team.creator,
        members: team.members,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching team:', error);
      throw new InternalServerErrorException('Failed to fetch team');
    }
  }

  async getUserTeams(userId: string): Promise<TeamResponseDto[]> {
    try {
      const teams = await this.prisma.team.findMany({
        where: {
          OR: [
            { creatorId: userId },
            {
              memberIds: {
                has: userId,
              },
            },
          ],
        },
        include: {
          creator: true,
          members: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        creatorId: team.creatorId,
        createdAt: team.createdAt,
        creator: team.creator,
        members: team.members,
      }));
    } catch (error) {
      console.error('Error fetching user teams:', error);
      throw new InternalServerErrorException('Failed to fetch user teams');
    }
  }

  async getUserTeamsByEmail(userEmail: string): Promise<FormattedTeamDto[]> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Find teams where user is creator or member
      const teams = await this.prisma.team.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            {
              memberIds: {
                has: user.id,
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return teams.map((team) => ({
        title: team.name,
        url: `/dashboard/tasks/${team.id}`,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user teams by email:', error);
      throw new InternalServerErrorException('Failed to fetch user teams');
    }
  }

  async getTeamsByEmailForGroupChat(
    userEmail: string,
  ): Promise<TeamResponseDto[]> {
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Find teams where user is creator or member
      const teams = await this.prisma.team.findMany({
        where: {
          OR: [
            { creatorId: user.id },
            {
              memberIds: {
                has: user.id,
              },
            },
          ],
        },
        include: {
          creator: true,
          members: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        creatorId: team.creatorId,
        createdAt: team.createdAt,
        creator: team.creator,
        members: team.members,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error fetching user teams for group chat:', error);
      throw new InternalServerErrorException('Failed to fetch user teams');
    }
  }

  async updateTeam(
    id: string,
    updateTeamDto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    try {
      const team = await this.prisma.team.update({
        where: { id },
        data: updateTeamDto,
        include: {
          creator: true,
          members: true,
        },
      });

      return {
        id: team.id,
        name: team.name,
        description: team.description,
        type: team.type,
        creatorId: team.creatorId,
        createdAt: team.createdAt,
        creator: team.creator,
        members: team.members,
      };
    } catch (error) {
      console.error('Error updating team:', error);
      throw new InternalServerErrorException('Failed to update team');
    }
  }

  async deleteTeam(id: string): Promise<{ message: string }> {
    try {
      const team = await this.prisma.team.findUnique({ where: { id } });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      await this.prisma.team.delete({ where: { id } });
      return { message: 'Team deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error deleting team:', error);
      throw new InternalServerErrorException('Failed to delete team');
    }
  }

  async addMemberToTeam(
    addMemberDto: AddMemberDto,
  ): Promise<{ message: string; team: TeamResponseDto }> {
    try {
      const { teamId, memberEmail } = addMemberDto;

      // Check if team exists
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      // Find member by email
      const member = await this.prisma.user.findUnique({
        where: { email: memberEmail },
      });

      if (!member) {
        throw new NotFoundException('Member not found');
      }

      // Check if member is already in team
      const existingMember = team.memberIds.includes(member.id);
      if (existingMember) {
        throw new BadRequestException('Member already in team');
      }

      // Add member to team
      const updatedTeam = await this.prisma.team.update({
        where: { id: teamId },
        data: {
          memberIds: {
            push: member.id,
          },
        },
        include: {
          creator: true,
          members: true,
        },
      });

      return {
        message: 'Member added to team successfully',
        team: {
          id: updatedTeam.id,
          name: updatedTeam.name,
          description: updatedTeam.description,
          type: updatedTeam.type,
          creatorId: updatedTeam.creatorId,
          createdAt: updatedTeam.createdAt,
          creator: updatedTeam.creator,
          members: updatedTeam.members,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error adding member to team:', error);
      throw new InternalServerErrorException('Failed to add member to team');
    }
  }
}
