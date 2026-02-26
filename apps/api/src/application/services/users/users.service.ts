import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IUserRepository } from '../../../domain/interfaces/user-repository.interface';
import { UpdateProfileDto } from '../../dtos/users/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(
        @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    ) { }

    async getProfile(userId: number): Promise<any> {
        const user = await this.userRepository.findById(userId.toString());
        if (!user) throw new NotFoundException('User not found');

        // Exclude password hash before returning
        const { passwordHash, ...profile } = user;
        return profile;
    }

    async updateProfile(userId: number, dto: UpdateProfileDto): Promise<any> {
        let user = await this.userRepository.findById(userId.toString());
        if (!user) throw new NotFoundException('User not found');

        // Logic to update entity
        if (dto.fullName) user.fullName = dto.fullName;
        if (dto.email) user.email = dto.email;

        await this.userRepository.save(user);

        const { passwordHash, ...profile } = user;
        return profile;
    }
}
