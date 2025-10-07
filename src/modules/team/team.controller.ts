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
import { TeamService } from './team.service';
import {
  CreateTeamDto,
  UpdateTeamDto,
  AddMemberDto,
  TeamResponseDto,
  FormattedTeamDto,
} from './dto/team.dto';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createTeam(
    @Body() createTeamDto: CreateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.createTeam(createTeamDto);
  }

  @Get(':id')
  async getTeam(@Param('id') id: string): Promise<TeamResponseDto> {
    return this.teamService.getTeamById(id);
  }

  @Get('user/teams/:userId')
  async getUserTeams(
    @Param('userId') userId: string,
  ): Promise<TeamResponseDto[]> {
    return this.teamService.getUserTeams(userId);
  }

  @Get('user/teams/email/:userEmail')
  async getUserTeamsByEmail(
    @Param('userEmail') userEmail: string,
  ): Promise<FormattedTeamDto[]> {
    return this.teamService.getUserTeamsByEmail(userEmail);
  }

  @Get('get-teams-by-email/:userEmail')
  async getTeamsByEmailForGroupChat(
    @Param('userEmail') userEmail: string,
  ): Promise<TeamResponseDto[]> {
    return this.teamService.getTeamsByEmailForGroupChat(userEmail);
  }

  @Put(':id')
  async updateTeam(
    @Param('id') id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<{ message: string; team: TeamResponseDto }> {
    const team = await this.teamService.updateTeam(id, updateTeamDto);
    return {
      message: 'Team updated successfully',
      team,
    };
  }

  @Delete(':id')
  async deleteTeam(@Param('id') id: string): Promise<{ message: string }> {
    return this.teamService.deleteTeam(id);
  }

  @Post('addMember')
  async addMemberToTeam(
    @Body() addMemberDto: AddMemberDto,
  ): Promise<{ message: string; team: TeamResponseDto }> {
    return this.teamService.addMemberToTeam(addMemberDto);
  }
}
