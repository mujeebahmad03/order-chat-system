import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from "./dto";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guard";
import { GetUser, Roles } from "../auth/decorators";
import { ApiPaginatedResponse } from "src/common/decorators";
import { PaginationDto } from "src/common/dto";

@ApiTags("Orders")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: "Create a new order",
    description: "This endpoint allows a user to create a new order.",
  })
  @ApiCreatedResponse({
    type: OrderEntity,
    description: "The newly created order is returned.",
  })
  @ApiBadRequestResponse({ description: "Invalid input data." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  async create(
    @GetUser("id") userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all orders",
    description:
      "Retrieve a list of all orders associated with the authenticated user. Admins can view all orders.",
  })
  @ApiQuery({ type: PaginationDto })
  @ApiPaginatedResponse(OrderEntity)
  @ApiBadRequestResponse({ description: "Invalid pagination parameters." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async findAll(
    @GetUser("id") userId: string,
    @GetUser("role") userRole: UserRole,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.ordersService.findAll(userId, userRole, paginationDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get order by ID",
    description:
      "Retrieve details of a specific order using its unique identifier.",
  })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the order.",
    type: String,
  })
  @ApiOkResponse({
    type: OrderEntity,
    description: "Order details are returned.",
  })
  @ApiBadRequestResponse({ description: "Invalid order ID." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser("id") userId: string,
    @GetUser("role") userRole: UserRole,
  ): Promise<OrderEntity> {
    return this.ordersService.findOne(id, userId, userRole);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update order",
    description:
      "Update details of a specific order. Users can only update their own orders.",
  })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the order to update.",
    type: String,
  })
  @ApiOkResponse({
    type: OrderEntity,
    description: "The updated order is returned.",
  })
  @ApiBadRequestResponse({ description: "Invalid input data or order ID." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser("id") userId: string,
    @GetUser("role") userRole: UserRole,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    return this.ordersService.update(id, userId, userRole, updateOrderDto);
  }

  @Patch(":id/status")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Update order status (Admin only)",
    description: "Allows an admin to update the status of a specific order.",
  })
  @ApiParam({
    name: "id",
    description: "The unique identifier of the order to update.",
    type: String,
  })
  @ApiOkResponse({
    type: OrderEntity,
    description: "The updated order is returned.",
  })
  @ApiBadRequestResponse({ description: "Invalid input data or order ID." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @GetUser("id") userId: string,
    @GetUser("role") userRole: UserRole,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    return this.ordersService.updateStatus(
      id,
      userId,
      userRole,
      updateStatusDto,
    );
  }
}
