import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

interface ClerkUser {
  clerkId: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findOrCreate(clerkUser: ClerkUser): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.clerkId },
    });

    if (!user) {
      this.logger.log(`Creating new user for Clerk ID: ${clerkUser.clerkId}`);
      
      // Ensure email is provided, use a fallback if not
      const email = clerkUser.email || `${clerkUser.clerkId}@example.com`;
      const name = clerkUser.name || 'User';

      try {
        user = await this.prisma.user.create({
          data: {
            clerkId: clerkUser.clerkId,
            email: email,
            name: name,
          },
        });
        this.logger.log(`Created user with ID: ${user.id}`);
      } catch (error) {
        this.logger.error(`Failed to create user: ${error.message}`);
        throw error;
      }
    }

    return user;
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getUsers(): Promise<Partial<User>[]> {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        clerkId: true, // Include clerkId for frontend mapping
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }

  // New method to get user by Clerk ID for task assignment
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { clerkId },
    });
  }
}