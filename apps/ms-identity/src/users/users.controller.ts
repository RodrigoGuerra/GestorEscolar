import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ProvisionUserDto } from './dto/provision-user.dto';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('provision')
  async provision(@Body() provisionUserDto: ProvisionUserDto) {
    return this.usersService.provision(provisionUserDto);
  }

  @Get(':email')
  async findByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
