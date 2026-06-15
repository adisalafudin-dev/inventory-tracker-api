import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Tandai route ini sebagai publik — tidak butuh token
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
