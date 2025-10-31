import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus, Priority, Task, Prisma } from '@prisma/client';

interface FilterTasksParams {
  status?: TaskStatus;
  priority?: string;
  assignedUserId?: string;
}

interface TaskWithRelations extends Task {
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  project: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<TaskWithRelations> {
    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: {
        id: createTaskDto.projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || TaskStatus.TODO,
        priority: createTaskDto.priority || Priority.MEDIUM,
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        tags: createTaskDto.tags || [],
        assignedUserId: createTaskDto.assignedUserId || null,
        projectId: createTaskDto.projectId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return task as TaskWithRelations;
  }

  async updateTask(
    userId: string,
    taskId: string,
    updateData: Prisma.TaskUpdateInput,
  ): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Ensure dueDate is properly formatted
    if (updateData.dueDate && typeof updateData.dueDate === 'string') {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Remove any fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...cleanUpdateData } = updateData as any;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: cleanUpdateData,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return updatedTask as TaskWithRelations;
  }

  async getProjectTasks(userId: string, projectId: string): Promise<Task[]> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async moveTask(
    userId: string,
    taskId: string,
    status: TaskStatus,
  ): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const movedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return movedTask as TaskWithRelations;
  }

  async deleteTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async cloneTask(userId: string, taskId: string): Promise<TaskWithRelations> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          userId,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, createdAt, updatedAt, ...taskData } = task;

    const clonedTask = await this.prisma.task.create({
      data: {
        ...taskData,
        title: `${task.title} (Copy)`,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return clonedTask as TaskWithRelations;
  }

  async searchTasks(
    userId: string,
    projectId: string,
    searchQuery: string,
  ): Promise<Task[]> {
    return await this.prisma.task.findMany({
      where: {
        projectId,
        project: {
          userId,
        },
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { tags: { has: searchQuery } },
        ],
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async filterTasks(
    userId: string,
    projectId: string,
    filters: FilterTasksParams,
  ): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {
      projectId,
      project: {
        userId,
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority as Priority;
    }

    if (filters.assignedUserId) {
      where.assignedUserId = filters.assignedUserId;
    }

    return await this.prisma.task.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
