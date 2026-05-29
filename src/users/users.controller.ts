import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Users')
@ApiBearerAuth() // Tells Swagger this route needs a Bearer token
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  getMe(@GetUser() user: any) {
    // `user` is the sanitized object returned from JwtStrategy.validate()
    // The password field is already stripped — never expose it.
    return user;
  }

  @Get('me/email')
  @ApiOperation({ summary: 'Get current user email only' })
  getMyEmail(@GetUser('email') email: string) {
    return { email };
  }
}
