import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';

interface ClerkUserResponse {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

interface FormattedUser {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class ClerkService {
  private readonly baseUrl = 'https://api.clerk.com/v1';
  private readonly secretKey = process.env.CLERK_SECRET_KEY;

  async getAllUsers(): Promise<FormattedUser[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (!response.ok) {
        throw new HttpException(
          `Clerk API error: ${response.statusText}`,
          response.status,
        );
      }

      const users = (await response.json()) as ClerkUserResponse[];

      return users.map((user) => ({
        id: user.id,
        email: user.email_addresses?.[0]?.email_address ?? '',
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
      }));
    } catch (error) {
      console.error('Error fetching Clerk users:', error);
      throw new HttpException(
        'Failed to fetch users from Clerk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
