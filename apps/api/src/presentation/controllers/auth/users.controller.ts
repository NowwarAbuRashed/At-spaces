import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../../../application/services/users/users.service';
import { UpdateProfileDto } from '../../../application/dtos/users/update-profile.dto';

@ApiTags('Users')
@ApiBearerAuth() // Assuming global or route-specific JWT protection
@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return the current user profile' })
    async getProfile(@Request() req: any) {
        // req.user would typically be set by a JwtAuthGuard
        const userId = req.user?.id || 1; // Fallback for mocking/tests
        return this.usersService.getProfile(userId);
    }

    @Put('profile')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Return updated profile' })
    async updateProfile(@Request() req: any, @Body() updateProfileDto: UpdateProfileDto) {
        const userId = req.user?.id || 1; // Fallback for mocking/tests
        return this.usersService.updateProfile(userId, updateProfileDto);
    }
}
