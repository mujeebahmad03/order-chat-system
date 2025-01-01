import { Injectable } from "@nestjs/common";
import { OrderStatus, UserRole } from "@prisma/client";

import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto } from "./dto";
import { OrderEntity } from "./entities/order.entity";
import { ChatService } from "../chat/chat.service";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto } from "src/common/dto";
import { ExceptionHelperService } from "src/common/exceptions";
import { PaginatedResponse } from "src/common/interfaces";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exceptionHelper: ExceptionHelperService,
    private readonly chatService: ChatService,
  ) {}

  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderEntity> {
    // Create order with initial REVIEW status
    const order = await this.prisma.$transaction(async (prisma) => {
      const newOrder = await prisma.order.create({
        data: {
          ...createOrderDto,
          userId,
          status: OrderStatus.REVIEW,
        },
      });

      // Automatically create chat room for the order
      await this.chatService.createChatRoom(newOrder.id);

      return newOrder;
    });

    return order;
  }

  async findAll(
    userId: string,
    userRole: UserRole,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<OrderEntity>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationDto;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    const where = userRole === UserRole.REGULAR ? { userId } : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, email: true } },
          chatRoom: {
            select: { id: true, isOpen: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<OrderEntity> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        chatRoom: { select: { id: true, isOpen: true } },
      },
    });

    if (!order) {
      this.exceptionHelper.throwNotFoundException(
        `Order with ID ${id} not found`,
      );
    }

    // Check if user has access to this order
    if (userRole === UserRole.REGULAR && order.userId !== userId) {
      this.exceptionHelper.throwForbiddenException(
        "You do not have access to this order",
      );
    }

    return order;
  }

  async update(
    id: string,
    userId: string,
    userRole: UserRole,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    // Check if order exists and user has access
    await this.findOne(id, userId, userRole);

    // Regular users can only update their own orders in REVIEW status
    if (userRole === UserRole.REGULAR) {
      const order = await this.prisma.order.findUnique({
        where: { id },
        select: { status: true },
      });

      if (order?.status !== OrderStatus.REVIEW) {
        this.exceptionHelper.throwForbiddenException(
          "Cannot update order after review stage",
        );
      }
    }

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    userRole: UserRole,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderEntity> {
    // Only admins can update status
    if (userRole !== UserRole.ADMIN) {
      this.exceptionHelper.throwForbiddenException(
        "Only admins can update order status",
      );
    }

    const order = await this.findOne(id, userId, userRole);

    // Validate status transition
    this.validateStatusTransition(order.status, updateStatusDto.status);

    return this.prisma.order.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.REVIEW]: [OrderStatus.PROCESSING],
      [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      this.exceptionHelper.throwForbiddenException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
