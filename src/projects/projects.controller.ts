import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';
import { Project, Prisma } from '@prisma/client';

interface AuthenticatedRequest {
  user?: {
    clerkId: string;
    email: string;
    name: string;
  };
  headers: {
    authorization?: string;
  };
}

@Controller('projects')
@UseGuards(ClerkAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.projectsService.createProject(user.id, createProjectDto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest): Promise<unknown> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.projectsService.getUserProjects(user.id);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Project | null> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.projectsService.getProject(user.id, id);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateData: Prisma.ProjectUpdateInput,
  ): Promise<Project> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.projectsService.updateProject(user.id, id, updateData);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Project> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.projectsService.deleteProject(user.id, id);
  }
}
