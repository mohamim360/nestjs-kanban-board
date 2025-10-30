import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface ClerkPayload {
  sub: string;
  email?: string;
  primary_email_address_id?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

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

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    console.log('Auth Guard - Token received:', token ? 'Yes' : 'No');

    if (!token) {
      console.log('No token provided in request headers');
      throw new UnauthorizedException('No token provided');
    }

    try {
      // For development, let's decode the JWT to get user info
      // In production, verify with Clerk's API
      const payload = this.decodeJwt(token) as ClerkPayload;
      console.log('JWT Payload:', payload);

      if (!payload.sub) {
        throw new Error('Invalid token: no user ID');
      }

      // Extract user information from JWT payload
      const email = payload.email || `${payload.sub}@example.com`;
      const name =
        payload.first_name && payload.last_name
          ? `${payload.first_name} ${payload.last_name}`
          : payload.username || 'User';

      request.user = {
        clerkId: payload.sub,
        email: email,
        name: name,
      };

      console.log('Auth successful - user assigned:', request.user);
      return true;
    } catch (error: unknown) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const authHeader = request.headers?.authorization;
    console.log('Auth Header:', authHeader);

    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      return authHeader.substring(7);
    }
    return null;
  }

  // Simple JWT decoding (for development only)
  private decodeJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT decoding failed:', error);
      throw new Error('Invalid JWT format');
    }
  }
}
