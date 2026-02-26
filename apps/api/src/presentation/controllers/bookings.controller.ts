import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CreateBookingDto } from '../../application/dtos/requests/create-booking.dto';
import { BookingService } from '../../application/services/booking.service';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../common/guards/roles.guard';
// import { Roles } from '../../common/decorators/roles.decorator';

@Controller('bookings')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    // @Roles('customer')
    async create(
        @Body() dto: CreateBookingDto,
        @Req() req: any,
    ) {
        const customerId = req.user?.id || 'dummy-customer-id';
        return this.bookingService.createBooking(dto, customerId);
    }

    @Get('my')
    // @Roles('customer')
    async getMyBookings(@Req() req: any) {
        const customerId = req.user?.id || 'dummy-customer-id';
        return this.bookingService.findByCustomer(customerId);
    }

    @Patch(':id/cancel')
    // @Roles('customer')
    async cancel(
        @Param('id') id: string,
        @Body('reason') reason: string,
        @Req() req: any,
    ) {
        const customerId = req.user?.id || 'dummy-customer-id';
        return this.bookingService.cancelBooking(id, customerId, reason);
    }

    @Patch(':id/check-in')
    // @Roles('vendor')
    async checkIn(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const vendorId = req.user?.id || 'dummy-vendor-id';
        return this.bookingService.checkIn(id, vendorId);
    }

    @Patch(':id/no-show')
    // @Roles('vendor')
    async markNoShow(
        @Param('id') id: string,
        @Req() req: any,
    ) {
        const vendorId = req.user?.id || 'dummy-vendor-id';
        return this.bookingService.markNoShow(id, vendorId);
    }
}
