import { Body, Controller, Get, ParseIntPipe, Patch, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth-guard/jwt-guard';
import { UsersService } from '../services/users.service';
import {UserDTO, GamesDTO, AllGames, topPlayers} from '../dto/dto-classes'
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('')
@ApiTags('Request')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly UserService : UsersService){}

    @Get('getNotification')
    async getNotification(@Req() req)
    {
		  // this.UserService.getNotification(req.user);
    }

    // @Get('Get-Notification')
    // getNotification()
    // {
      
    // }
}
