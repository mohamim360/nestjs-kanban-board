import { Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';
import { ClerkController } from './clerk.controller';

@Module({
  providers: [ClerkAuthGuard, ClerkService],
  exports: [ClerkAuthGuard],
  controllers: [ClerkController],
})
export class AuthModule {}
