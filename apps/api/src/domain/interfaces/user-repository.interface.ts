export interface IUserRepository {
    findById(id: string): Promise<any>;
    save(user: any): Promise<void>;
}
