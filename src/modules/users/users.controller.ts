import {
  Controller,
  Get,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto";
import { GetUser, Roles } from "../auth/decorators";
import { JwtAuthGuard, RolesGuard } from "../auth/guard";
import { UserResponse } from "../auth/entities";
import { ApiPaginatedResponse } from "src/common/decorators";
import { PaginationDto } from "src/common/dto";

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("accessToken")
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get all users",
    description:
      "Retrieve a paginated list of all users. Only accessible by administrators.",
  })
  @ApiQuery({
    type: PaginationDto,
    description: "Pagination parameters to limit and offset results.",
  })
  @ApiPaginatedResponse(UserResponse)
  @ApiBadRequestResponse({ description: "Invalid pagination parameters." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async getAllUsers(@Query() paginationDto: PaginationDto) {
    return this.userService.getAllUsers(paginationDto);
  }

  @Get("me")
  @ApiOperation({
    summary: "Get my profile",
    description:
      "Retrieve the profile details of the currently authenticated user.",
  })
  @ApiOkResponse({
    description: "Returns the profile details of the authenticated user.",
    type: UserResponse,
  })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiNotFoundResponse({ description: "User not found." })
  async getMyProfile(@GetUser("id") userId: string): Promise<UserResponse> {
    return this.userService.getUserById(userId);
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Get a user by ID",
    description:
      "Retrieve the details of a specific user by their ID. Only accessible by administrators.",
  })
  @ApiOkResponse({
    description: "Returns the details of the specified user.",
    type: UserResponse,
  })
  @ApiNotFoundResponse({ description: "User not found." })
  @ApiBadRequestResponse({ description: "Invalid user ID format." })
  async getUserById(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<UserResponse> {
    return this.userService.getUserById(id);
  }

  @Patch("update")
  @ApiOperation({
    summary: "Update my profile",
    description:
      "Update the profile details of the currently authenticated user.",
  })
  @ApiOkResponse({
    description: "The user profile was successfully updated.",
    type: UserResponse,
  })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiNotFoundResponse({ description: "User not found." })
  @ApiBadRequestResponse({ description: "Invalid update data provided." })
  async updateUser(
    @GetUser("id") userId: string,
    @Body() data: UpdateUserDto,
  ): Promise<UserResponse> {
    return this.userService.updateUser(userId, data);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: "Delete a user by ID",
    description:
      "Delete a specific user by their ID. Only accessible by administrators.",
  })
  @ApiOkResponse({ description: "The user was successfully deleted." })
  @ApiNotFoundResponse({ description: "User not found." })
  @ApiBadRequestResponse({ description: "Invalid user ID format." })
  @ApiUnauthorizedResponse({ description: "User is not authenticated." })
  @ApiForbiddenResponse({
    description: "User does not have sufficient permissions.",
  })
  async deleteUser(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.deleteUser(id);
  }
}
