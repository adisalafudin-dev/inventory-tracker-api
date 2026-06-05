import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: @GetUser() user — returns the full user object from req.user
// Usage: @GetUser('email') email — returns only the email field
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user = request.user;

    // If a specific field is requested, return only that field
    return data && user ? user[data] : user;
  },
);
