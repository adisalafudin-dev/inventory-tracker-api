import { CreateProductSchema } from './create-product.dto';
import { createZodDto } from 'nestjs-zod';

export const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
