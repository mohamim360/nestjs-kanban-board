import { Global, Module } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkService } from './clerk.service';
import { ClerkController } from './clerk.controller';

@Global() 
@Module({
  providers: [ClerkAuthGuard, ClerkService],
  exports: [ClerkAuthGuard, ClerkService],
  controllers: [ClerkController],
})
export class AuthModule {}