import { AuthGuard } from '@nestjs/passport';

// A named class guard is cleaner than using @UseGuards(AuthGuard('jwt'))
// everywhere. It also allows for easy extension later (e.g., adding
// custom error handling or logging).
export class JwtAuthGuard extends AuthGuard('jwt') {}
