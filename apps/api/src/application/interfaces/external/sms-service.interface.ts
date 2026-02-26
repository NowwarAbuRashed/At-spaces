export interface ISmsService {
    send(to: string, message: string): Promise<void>;
}
