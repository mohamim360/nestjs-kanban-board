import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';

@Injectable()
export class ClerkService {
  private readonly baseUrl = 'https://api.clerk.com/v1';
  private readonly secretKey = process.env.CLERK_SECRET_KEY;

  async getAllUsers() {
    try {
      const res = await fetch(`${this.baseUrl}/users`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (!res.ok) {
        throw new HttpException(
          `Clerk API error: ${res.statusText}`,
          res.status,
        );
      }

      
      const users: any[] = (await res.json()) as any[];

    
      return users.map((u) => ({
        id: u.id,
        email: u.email_addresses?.[0]?.email_address ?? '',
        name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
      }));
    } catch (err) {
      console.error('Error fetching Clerk users:', err);
      throw new HttpException(
        'Failed to fetch users from Clerk',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
