// src/orders/orders.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderDto } from './dto/update-order-status.dto';
import { Role } from 'generated/prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(ZodValidationPipe)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // src/orders/orders.controller.ts — update endpoint findAll
  @Get()
  @ApiOperation({ summary: 'List order dengan filter dan pagination' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'platformId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query() query: QueryOrderDto & PaginationDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu order' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa buat order baru
  @Post()
  @ApiOperation({ summary: 'Buat order baru (otomatis kurangi stok)' })
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Roles(Role.ADMIN) // Hanya admin yang bisa update status order
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update status order' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.updateStatus(id, dto);
  }
}
