import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { BoardService } from './board.service';
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

@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.createBoard(createBoardDto);
  }

  @Get(':id')
  async getBoardById(@Param('id') id: string): Promise<BoardResponseDto> {
    return this.boardService.getBoardById(id);
  }

  @Put(':id')
  async updateBoard(
    @Param('id') id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.updateBoard(id, updateBoardDto);
  }

  @Delete(':id')
  async deleteBoard(@Param('id') id: string): Promise<{ message: string }> {
    return this.boardService.deleteBoard(id);
  }

  @Post('members')
  async addMemberToBoard(
    @Body() addMemberDto: AddMemberToBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.addMemberToBoard(addMemberDto);
  }

  @Post('comments')
  async addCommentToBoard(
    @Body() addCommentDto: AddCommentToBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.addCommentToBoard(addCommentDto);
  }

  @Put(':boardId/status')
  async updateBoardStatus(
    @Param('boardId') boardId: string,
    @Body() updateStatusDto: UpdateBoardStatusDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.updateBoardStatus(boardId, updateStatusDto);
  }

  @Post('attachments')
  async addAttachmentToBoard(
    @Body() addAttachmentDto: AddAttachmentToBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardService.addAttachmentToBoard(addAttachmentDto);
  }

  @Get('team/:teamId')
  async getBoardsByTeamId(
    @Param('teamId') teamId: string,
  ): Promise<BoardResponseDto[]> {
    return this.boardService.getBoardsByTeamId(teamId);
  }

  @Get('task/email/:email')
  async getBoardsByUserEmail(
    @Param('email') email: string,
  ): Promise<BoardResponseDto[]> {
    return this.boardService.getBoardsByUserEmail(email);
  }

  @Get('task/user/full-summary/:email')
  async getUserOverallAndTeamTaskSummary(
    @Param('email') email: string,
  ): Promise<BoardSummaryDto> {
    return this.boardService.getUserOverallAndTeamTaskSummary(email);
  }
}
