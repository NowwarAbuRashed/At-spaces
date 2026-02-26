export interface IVendorServiceRepository {
    findById(id: string): Promise<any>;
    save(vendorService: any): Promise<void>;
}
