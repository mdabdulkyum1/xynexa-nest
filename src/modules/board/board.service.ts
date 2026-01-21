import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardStatus, Board } from '@prisma/client';
import {
  CreateBoardDto,
  UpdateBoardDto,
  BoardResponseDto,
  AddMemberToBoardDto,
  AddCommentToBoardDto,
  AddAttachmentToBoardDto,
  UpdateBoardStatusDto,
  BoardSummaryDto,
} from './dto/board.dto';
import { EmailService } from '../email/email.service';

type BoardWithRelations = Board & {
  members: any[];
  comments: any[];
  attachments?: any[];
};

@Injectable()
export class BoardService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createBoard(createBoardDto: CreateBoardDto): Promise<BoardResponseDto> {
    const board = await this.prisma.board.create({
      data: {
        title: createBoardDto.title,
        description: createBoardDto.description,
        teamId: createBoardDto.teamId,
        status: createBoardDto.status || BoardStatus.todo,
        targetDate: createBoardDto.targetDate
          ? new Date(createBoardDto.targetDate)
          : undefined,
      },
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

    return this.formatBoardResponse(board);
  }

  async getBoardById(id: string): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({
      where: { id },
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

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.formatBoardResponse(board);
  }

  async updateBoard(
    id: string,
    updateBoardDto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    const updateData: any = {};

    if (updateBoardDto.title !== undefined)
      updateData.title = updateBoardDto.title;
    if (updateBoardDto.description !== undefined)
      updateData.description = updateBoardDto.description;
    if (updateBoardDto.status !== undefined)
      updateData.status = updateBoardDto.status;
    if (updateBoardDto.targetDate !== undefined) {
      updateData.targetDate = updateBoardDto.targetDate
        ? new Date(updateBoardDto.targetDate)
        : null;
    }

    const board = await this.prisma.board.update({
      where: { id },
      data: updateData,
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

    return this.formatBoardResponse(board);
  }

  async deleteBoard(id: string): Promise<{ message: string }> {
    const board = await this.prisma.board.findUnique({ where: { id } });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.prisma.board.delete({ where: { id } });

    return { message: 'Board deleted successfully' };
  }

  async addMemberToBoard(
    addMemberDto: AddMemberToBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({
      where: { id: addMemberDto.boardId },
      include: { members: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: addMemberDto.boardId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User already in board');
    }

    // Add member
    await this.prisma.boardMember.create({
      data: {
        boardId: addMemberDto.boardId,
        userId: addMemberDto.userId,
      },
    });

    // Fire-and-forget assignment email
    void this.sendTaskAssignmentEmail(addMemberDto.boardId, addMemberDto.userId);

    return this.getBoardById(addMemberDto.boardId);
  }

  async addCommentToBoard(
    addCommentDto: AddCommentToBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({
      where: { id: addCommentDto.boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.prisma.boardComment.create({
      data: {
        boardId: addCommentDto.boardId,
        userId: addCommentDto.userId,
        text: addCommentDto.text,
      },
    });

    return this.getBoardById(addCommentDto.boardId);
  }

  async addAttachmentToBoard(
    addAttachmentDto: AddAttachmentToBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.prisma.board.findUnique({
      where: { id: addAttachmentDto.boardId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    await this.prisma.boardAttachment.create({
      data: {
        boardId: addAttachmentDto.boardId,
        userId: addAttachmentDto.userId,
        url: addAttachmentDto.url,
        filename: addAttachmentDto.filename,
      },
    });

    return this.getBoardById(addAttachmentDto.boardId);
  }

  async updateBoardStatus(
    boardId: string,
    updateStatusDto: UpdateBoardStatusDto,
  ): Promise<BoardResponseDto> {
    const board = await this.prisma.board.update({
      where: { id: boardId },
      data: { status: updateStatusDto.status },
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
      },
    });

    return this.formatBoardResponse(board);
  }

  async getBoardsByTeamId(teamId: string): Promise<BoardResponseDto[]> {
    const boards = await this.prisma.board.findMany({
      where: { teamId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return boards.map((board) => this.formatBoardResponse(board));
  }

  async getBoardsByUserEmail(email: string): Promise<BoardResponseDto[]> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const boards = await this.prisma.board.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
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
      },
    });

    return boards.map((board) => this.formatBoardResponse(board));
  }

  async getUserOverallAndTeamTaskSummary(
    email: string,
  ): Promise<BoardSummaryDto> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user boards
    const userBoards = await this.prisma.board.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    // Calculate overall summary
    const overallTotalTasks = userBoards.length;
    const overallTodoTasks = userBoards.filter(
      (board) => board.status === BoardStatus.todo,
    ).length;
    const overallInProgressTasks = userBoards.filter(
      (board) => board.status === BoardStatus.in_progress,
    ).length;
    const overallDoneTasks = userBoards.filter(
      (board) => board.status === BoardStatus.done,
    ).length;

    // Get teams where user is member or creator
    const teams = await this.prisma.team.findMany({
      where: {
        OR: [
          { creatorId: user.id },
          {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        ],
      },
      include: {
        members: true,
        boards: true,
      },
    });

    const teamSummaries = teams.map((team) => ({
      teamName: team.name,
      teamId: team.id,
      totalMembers: team.members.length,
      totalTasks: team.boards.length,
    }));

    return {
      overallSummary: {
        totalTasks: overallTotalTasks,
        todoTasks: overallTodoTasks,
        inProgressTasks: overallInProgressTasks,
        doneTasks: overallDoneTasks,
      },
      teamSummaries,
    };
  }

  private formatBoardResponse(board: BoardWithRelations): BoardResponseDto {
    return {
      id: board.id,
      title: board.title,
      description: board.description,
      teamId: board.teamId,
      status: board.status,
      targetDate: board.targetDate,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
      members: board.members?.map((member: any) => ({
        id: member.user.id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        imageUrl: member.user.imageUrl,
      })),
      comments: board.comments?.map((comment: any) => ({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        user: {
          id: comment.user.id,
          firstName: comment.user.firstName,
          lastName: comment.user.lastName,
          email: comment.user.email,
          imageUrl: comment.user.imageUrl,
        },
      })),
      attachments: board.attachments?.map((attachment: any) => ({
        id: attachment.id,
        url: attachment.url,
        filename: attachment.filename,
        createdAt: attachment.createdAt,
        user: {
          id: attachment.user.id,
          firstName: attachment.user.firstName,
          lastName: attachment.user.lastName,
          email: attachment.user.email,
          imageUrl: attachment.user.imageUrl,
        },
      })),
    };
  }
  private async sendTaskAssignmentEmail(
    boardId: string,
    userId: string,
  ): Promise<void> {
    try {
      const board = await this.prisma.board.findUnique({
        where: { id: boardId },
        include: {
          team: true,
        },
      });

      if (!board) return;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user?.email) return;

      const userName = user.firstName || user.lastName || 'there';

      await this.emailService.sendTemplateEmail(user.email, {
        subject: `You have been assigned a task: ${board.title}`,
        template: 'task-assigned',
        data: {
          userName,
          taskTitle: board.title,
          taskDescription: board.description ?? 'No description provided.',
          status: board.status,
          teamName: (board as any).team?.name ?? 'Team',
          targetDate: board.targetDate
            ? new Date(board.targetDate).toDateString()
            : 'Not set',
        },
      });
    } catch (error) {
      // Non-blocking; log and continue
      // eslint-disable-next-line no-console
      console.error('Failed to send task assignment email', error);
    }
  }
  async updateStatus(boardId: string, newStatus: BoardStatus | string) {
    return this.prisma.board.update({
      where: { id: boardId },
      data: { status: newStatus as BoardStatus },
      include: {
        members: {
          select: {
            id: true,
          },
        },
      },
    });
  }
}
