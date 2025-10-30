import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

interface ClerkUser {
  clerkId: string;
  email: string;
  name: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(clerkUser: ClerkUser): Promise<User> {
    let user = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.clerkId },
    });

    if (!user) {
      // Ensure email is provided, use a fallback if not
      const email = clerkUser.email || `${clerkUser.clerkId}@example.com`;
      const name = clerkUser.name || 'User';

      user = await this.prisma.user.create({
        data: {
          clerkId: clerkUser.clerkId,
          email: email,
          name: name,
        },
      });
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
        name: true,
        email: true,
        createdAt: true,
      },
    });
  }
}
