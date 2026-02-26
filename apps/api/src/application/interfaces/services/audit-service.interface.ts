export interface IAuditService {
    log(actorId: string, action: string, details?: any): Promise<void>;
}
