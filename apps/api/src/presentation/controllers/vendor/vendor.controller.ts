import { Controller, Get, Post, Put, Patch, Body, Param, Query, Request, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { VendorServiceLogic } from '../../../application/services/vendor/vendor-logic.service';
import { UpdatePriceDto, RequestCapacityDto, UpdateAvailabilityDto } from '../../../application/dtos/vendor/vendor.dtos';
import { BookingService } from '../../../application/services/booking.service';
import { ApprovalRequestService } from '../../../application/services/approval-request.service';

@ApiTags('Vendor')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles(UserRole.vendor)
@Controller('api')
export class VendorController {
    constructor(
        private readonly vendorLogicService: VendorServiceLogic,
        private readonly bookingService: BookingService,
        private readonly approvalRequestService: ApprovalRequestService
    ) { }

    @Post('vendors/register')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ summary: 'Register as a vendor' })
    async registerVendor(@Body() registerDto: any) {
        // Create an approval request for the admin
        return { message: "Vendor registration request submitted." };
    }

    @Get('vendors/dashboard')
    @ApiOperation({ summary: 'Vendor Dashboard Overview' })
    async getDashboard(@Request() req: any) {
        const vendorId = req.user?.id || 1;
        return this.vendorLogicService.getDashboard(vendorId);
    }

    @Get('vendor-services')
    @ApiOperation({ summary: 'List services for vendor' })
    async getServices(@Request() req: any) {
        const vendorId = req.user?.id || 1;
        return this.vendorLogicService.getVendorServices(vendorId);
    }

    @Put('vendor-services/:id/price')
    @ApiOperation({ summary: 'Update price of a service' })
    async updatePrice(@Request() req: any, @Param('id') id: number, @Body() dto: UpdatePriceDto) {
        const vendorId = req.user?.id || 1;
        return this.vendorLogicService.updatePrice(vendorId, id, dto);
    }

    @Post('vendor-services/:id/capacity-request')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ summary: 'Request capacity update for a service' })
    async requestCapacityChange(@Request() req: any, @Param('id') id: number, @Body() dto: RequestCapacityDto) {
        const vendorId = dto.vendorId || req.user?.id || 1;
        const branchId = dto.branchId || 1;
        return this.vendorLogicService.requestCapacityChange(vendorId, branchId, id, dto);
    }

    @Put('availability')
    @ApiOperation({ summary: 'Manage availability (blocks/slots)' })
    async updateAvailability(@Body() dto: UpdateAvailabilityDto) {
        return this.vendorLogicService.updateAvailability(dto);
    }

    @Get('vendors/bookings')
    @ApiOperation({ summary: 'View branch bookings' })
    @ApiQuery({ name: 'date', required: false })
    async getBookings(@Request() req: any, @Query('date') date?: string) {
        const vendorId = req.user?.id || 1;
        return this.vendorLogicService.getBranchBookings(vendorId, date);
    }

    @Patch('bookings/:id/status')
    @ApiOperation({ summary: 'Update booking status (check-in/no-show)' })
    async updateBookingStatus(@Request() req: any, @Param('id') id: number, @Body('status') status: string) {
        const vendorId = req.user?.id || 1;

        if (status === 'completed') {
            await this.bookingService.checkIn(id.toString(), vendorId.toString());
        } else if (status === 'no_show') {
            await this.bookingService.markNoShow(id.toString(), vendorId.toString());
        }

        return { message: "Booking status updated" };
    }
}
