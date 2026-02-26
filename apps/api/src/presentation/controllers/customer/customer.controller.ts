import { Controller, Get, Post, Body, Param, Query, Request, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomerService } from '../../../application/services/customer/customer.service';
import { CheckAvailabilityDto } from '../../../application/dtos/customer/check-availability.dto';
import { BookingService } from '../../../application/services/booking.service';
import { CreateBookingDto } from '../../../application/dtos/requests/create-booking.dto';

@ApiTags('Customer')
@Controller('api')
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
        private readonly bookingService: BookingService, // Reusing existing service for creation
    ) { }

    @Get('branches')
    @ApiOperation({ summary: 'List all branches with optional filtering' })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'serviceType', required: false })
    async getBranches(@Query('city') city?: string, @Query('serviceType') serviceType?: string) {
        return this.customerService.getBranches(city, serviceType);
    }

    @Get('branches/:id')
    @ApiOperation({ summary: 'Get details of a specific branch' })
    async getBranchDetails(@Param('id') id: number) {
        return this.customerService.getBranchDetails(id);
    }

    @Post('availability/check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Check availability and price' })
    async checkAvailability(@Body() checkDto: CheckAvailabilityDto) {
        return this.customerService.checkAvailability(checkDto);
    }

    // @UseGuards(JwtAuthGuard)
    @Post('bookings')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new booking' })
    async createBooking(@Request() req: any, @Body() createDto: CreateBookingDto) {
        const userId = (createDto as any).customerId || req.user?.id || 1;
        const booking = await this.bookingService.createBooking(createDto, userId.toString());
        return {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            totalPrice: booking.totalPrice,
            status: booking.status
        };
    }

    // @UseGuards(JwtAuthGuard)
    @Get('bookings/my')
    @ApiOperation({ summary: 'List my bookings' })
    async getMyBookings(@Request() req: any) {
        const userId = req.user?.id || 1; // Fallback
        return this.customerService.getMyBookings(userId);
    }

    // @UseGuards(JwtAuthGuard)
    @Post('bookings/:id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel a booking' })
    async cancelBooking(@Request() req: any, @Param('id') id: number) {
        const userId = req.user?.id || 1; // Fallback
        return this.customerService.cancelBooking(id, userId);
    }
}
