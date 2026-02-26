import { Controller, Get, Post, Put, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SharedLogicService } from '../../../application/services/shared/shared-logic.service';
import { AiRecommendDto, UpdateBranchFacilitiesDto, UpdateServiceFeaturesDto } from '../../../application/dtos/shared/shared.dtos';

@ApiTags('Shared')
@Controller('api')
export class SharedController {
    constructor(private readonly sharedLogicService: SharedLogicService) { }

    @Get('cities')
    @ApiOperation({ summary: 'List supported cities' })
    async getCities() {
        return this.sharedLogicService.getCities();
    }

    @Post('ai/recommend')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'AI based branch recommendation' })
    async aiRecommend(@Body() dto: AiRecommendDto) {
        return this.sharedLogicService.getAiRecommendation(dto);
    }

    @Get('facilities')
    @ApiOperation({ summary: 'List all universal facilities' })
    async getFacilities() {
        return this.sharedLogicService.getFacilities();
    }

    @Get('features')
    @ApiOperation({ summary: 'List all universal service features' })
    async getFeatures() {
        return this.sharedLogicService.getFeatures();
    }

    @Put('branches/:id/facilities')
    @ApiOperation({ summary: 'Manage branch facilities' })
    async updateBranchFacilities(@Param('id') id: number, @Body() dto: UpdateBranchFacilitiesDto) {
        await this.sharedLogicService.updateBranchFacilities(id, dto);
        return { message: "Branch facilities updated" };
    }

    @Put('vendor-services/:id/features')
    @ApiOperation({ summary: 'Manage service features' })
    async updateServiceFeatures(@Param('id') id: number, @Body() dto: UpdateServiceFeaturesDto) {
        await this.sharedLogicService.updateServiceFeatures(id, dto);
        return { message: "Service features updated" };
    }
}
