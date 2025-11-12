import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Controller('users')
export class ClerkController {
  constructor(private readonly clerkService: ClerkService) {}

  @UseGuards(ClerkAuthGuard)
  @Get()
  async getUsers() {
    return this.clerkService.getAllUsers();
  }
}
