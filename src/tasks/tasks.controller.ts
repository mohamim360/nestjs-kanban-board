import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { UsersService } from '../users/users.service';
import { TaskStatus, Task, Prisma } from '@prisma/client';

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

interface FilterParams {
  status?: TaskStatus;
  priority?: string;
  assignedUserId?: string;
}

@Controller('tasks')
@UseGuards(ClerkAuthGuard)
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.createTask(user.id, createTaskDto);
  }

  @Get('project/:projectId')
  async getProjectTasks(
    @Req() req: AuthenticatedRequest,
    @Param('projectId') projectId: string,
  ): Promise<Task[]> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.getProjectTasks(user.id, projectId);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateData: Prisma.TaskUpdateInput,
  ): Promise<Task> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.updateTask(user.id, id, updateData);
  }

  @Put(':id/move')
  async moveTask(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body('status') status: TaskStatus,
  ): Promise<Task> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.moveTask(user.id, id, status);
  }

  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Task> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.deleteTask(user.id, id);
  }

  @Post(':id/clone')
  async clone(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<Task> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.cloneTask(user.id, id);
  }

  @Get('search')
  async search(
    @Req() req: AuthenticatedRequest,
    @Query('projectId') projectId: string,
    @Query('q') searchQuery: string,
  ): Promise<Task[]> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    return this.tasksService.searchTasks(user.id, projectId, searchQuery);
  }

  @Get('filter')
  async filterTasks(
    @Req() req: AuthenticatedRequest,
    @Query('projectId') projectId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('assignedUser') assignedUserId?: string,
  ): Promise<Task[]> {
    if (!req.user) throw new Error('User not authenticated');
    const user = await this.usersService.findOrCreate(req.user);
    const filters: FilterParams = {
      status,
      priority,
      assignedUserId,
    };
    return this.tasksService.filterTasks(user.id, projectId, filters);
  }
}
