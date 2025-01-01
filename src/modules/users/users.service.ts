import { Injectable } from "@nestjs/common";

import { UpdateUserDto } from "./dto";
import { PrismaService } from "../prisma/prisma.service";
import { ExceptionHelperService } from "src/common/exceptions";
import { UserResponse } from "../auth/entities";
import { PaginationDto } from "src/common/dto";
import { PaginatedResponse } from "src/common/interfaces";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exceptionHelper: ExceptionHelperService,
  ) {}

  // Get all users
  async getAllUsers(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<UserResponse>> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Remove passwords from the response
    const allUsers = users.map((user) => {
      delete user.password;
      return user;
    });

    return {
      items: allUsers,
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

  // Get a user by ID
  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.exceptionHelper.throwNotFoundException("User not found");
    }

    // Remove sensitive data before returning
    delete user.password;
    return user;
  }

  // Update a user by ID
  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.exceptionHelper.throwNotFoundException("User not found");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    // Remove sensitive data before returning
    delete updatedUser.password;
    return updatedUser;
  }

  // Delete a user by ID
  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      this.exceptionHelper.throwNotFoundException("User not found");
    }

    await this.prisma.user.delete({ where: { id } });
  }
}
