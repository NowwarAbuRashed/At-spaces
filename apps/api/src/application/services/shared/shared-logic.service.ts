import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiRecommendDto, UpdateBranchFacilitiesDto, UpdateServiceFeaturesDto } from '../../dtos/shared/shared.dtos';
import { PrismaService } from '../../../infrastructure/services/prisma.service';

@Injectable()
export class SharedLogicService {
    private readonly openai: OpenAI;
    private readonly logger = new Logger(SharedLogicService.name);

    constructor(
        private configService: ConfigService,
        private readonly prisma: PrismaService
    ) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
        } else {
            this.logger.warn('OPENAI_API_KEY is not set in environment variables');
        }
    }

    async getCities(): Promise<string[]> {
        const branches = await this.prisma.branch.findMany({
            select: { city: true }
        });
        const allCities = branches.map(b => b.city);
        return [...new Set(allCities)];
    }

    async getAiRecommendation(dto: AiRecommendDto): Promise<any> {
        if (!this.openai) {
            return this.getFallbackRecommendation();
        }

        try {
            const prompt = `You are an AI assistant for a coworking space platform named At Spaces.
A user is looking for a branch or service matching their criteria:
Query: "${dto.query}"
Location: "${dto.location}"
Date/Time: "${dto.time}"
Duration: ${dto.duration} hours.

Based on this, recommend a branch and an alternative. Answer strictly in this JSON format:
{
  "recommendedBranch": { "id": number, "name": "string" },
  "alternatives": [ { "id": number, "name": "string" } ]
}
Available Mock Branches: "WeWork Abdali" (ID: 1), "ZINC King Hussein Business Park" (ID: 2), "The Office Space" (ID: 3).`;

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' },
            });

            const content = response.choices[0].message.content;
            if (content) {
                return JSON.parse(content);
            }
        } catch (error) {
            this.logger.error('Failed to fetch AI recommendation from OpenAI', error);
        }

        return this.getFallbackRecommendation();
    }

    private getFallbackRecommendation() {
        return {
            recommendedBranch: { id: 1, name: "WeWork Abdali" },
            alternatives: [
                { id: 2, name: "ZINC King Hussein Business Park" }
            ]
        };
    }

    async getFacilities(): Promise<any[]> {
        return this.prisma.facility.findMany();
    }

    async getFeatures(): Promise<any[]> {
        return this.prisma.feature.findMany();
    }

    async updateBranchFacilities(branchId: number | string, dto: UpdateBranchFacilitiesDto): Promise<void> {
        const bId = typeof branchId === 'string' ? parseInt(branchId, 10) : branchId;
        await this.prisma.branchFacility.deleteMany({
            where: { branchId: bId }
        });

        if (dto.facilities && dto.facilities.length > 0) {
            const data = dto.facilities.map(f => ({
                branchId: bId,
                facilityId: f.facilityId,
                isAvailable: f.isAvailable,
                description: f.description
            }));
            await this.prisma.branchFacility.createMany({ data });
        }
    }

    async updateServiceFeatures(serviceId: number | string, dto: UpdateServiceFeaturesDto): Promise<void> {
        const sId = typeof serviceId === 'string' ? parseInt(serviceId, 10) : serviceId;
        await this.prisma.serviceFeature.deleteMany({
            where: { vendorServiceId: sId }
        });

        if (dto.features && dto.features.length > 0) {
            const data = dto.features.map(f => ({
                vendorServiceId: sId,
                featureId: f.featureId,
                quantity: f.quantity
            }));
            await this.prisma.serviceFeature.createMany({ data });
        }
    }
}
