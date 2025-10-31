import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project, Prisma } from '@prisma/client';

interface ProjectWithTasks extends Project {
  tasks: unknown[];
  user: unknown;
}

interface ProjectWithCount extends ProjectWithTasks {
  _count: {
    tasks: number;
  };
  taskCount: number;
}

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async createProject(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectWithTasks> {
    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
        userId,
      },
      include: {
        tasks: {
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
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return project as ProjectWithTasks;
  }

  async getUserProjects(userId: string): Promise<ProjectWithCount[]> {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add taskCount to each project for easier frontend consumption
    return projects.map((project) => ({
      ...project,
      taskCount: project._count.tasks,
    })) as ProjectWithCount[];
  }

  async getProject(
    userId: string,
    projectId: string,
  ): Promise<ProjectWithTasks | null> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        tasks: {
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
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project as ProjectWithTasks;
  }

  async updateProject(
    userId: string,
    projectId: string,
    updateData: Prisma.ProjectUpdateInput,
  ): Promise<ProjectWithTasks> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return updatedProject as ProjectWithTasks;
  }

  async deleteProject(userId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.prisma.project.delete({
      where: { id: projectId },
    });
  }
}
