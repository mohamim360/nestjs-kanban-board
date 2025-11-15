import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { ClerkService } from 'src/auth/clerk.service';


interface ClerkUser {
  clerkId: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private clerkService: ClerkService 
  ) {}

  async findOrCreate(clerkUser: ClerkUser): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.clerkId },
    });

    if (!user) {
      this.logger.log(`Creating new user for Clerk ID: ${clerkUser.clerkId}`);

      // Use REAL data from Clerk, not example emails
      const email = clerkUser.email; // This is the real email from Clerk
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
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to create user: ${errorMessage}`);
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

  async getUsers(): Promise<any[]> {
    // Get users from Clerk to ensure we have the most up-to-date data
    try {
      const clerkUsers = await this.clerkService.getAllUsers();
      
      // Sync with local database
      const syncedUsers = await Promise.all(
        clerkUsers.map(async (clerkUser) => {
          const localUser = await this.findOrCreate({
            clerkId: clerkUser.id,
            email: clerkUser.email,
            name: clerkUser.name,
          });
          
          return {
            id: clerkUser.id, // Use Clerk ID for frontend
            localId: localUser.id, // Include local ID for backend operations
            name: clerkUser.name,
            email: clerkUser.email,
          };
        })
      );
      
      return syncedUsers;
    } catch (error) {
      this.logger.error('Failed to sync users with Clerk, falling back to local users');
      
      // Fallback: return local users with Clerk IDs
      const localUsers = await this.prisma.user.findMany({
        select: {
          id: true,
          clerkId: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
      
      return localUsers.map(user => ({
        id: user.clerkId, // Use Clerk ID as primary ID for frontend
        localId: user.id, // Include local ID
        name: user.name,
        email: user.email,
      }));
    }
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  // New method to get local user ID by Clerk ID
  async getLocalUserIdByClerkId(clerkId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });
    return user?.id || null;
  }
}