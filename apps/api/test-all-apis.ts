import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaClient } from '@prisma/client';

async function testAllApis() {
    console.log("Bootstrapping Application...");
    const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
    await app.listen(3001);
    const baseUrl = 'http://localhost:3001';

    // Seed database to satisfy foreign keys
    const prisma = new PrismaClient();
    await prisma.$connect();

    // Clear DB
    await prisma.approvalRequest.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.serviceFeature.deleteMany();
    await prisma.vendorService.deleteMany();
    await prisma.branchFacility.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.otpSession.deleteMany();
    await prisma.user.deleteMany();
    await prisma.service.deleteMany();
    await prisma.facility.deleteMany();
    await prisma.feature.deleteMany();

    const vendorUser = await prisma.user.create({
        data: { fullName: "Seed Vendor", role: "vendor", email: "seed@vendor.com", status: "active" }
    });

    const customerUser = await prisma.user.create({
        data: { fullName: "Seed Customer", role: "customer", email: "seed@customer.com", status: "active" }
    });
    const adminUser = await prisma.user.create({
        data: { fullName: "Seed Admin", role: "admin", email: "seed@admin.com", status: "active" }
    });

    const branch = await prisma.branch.create({
        data: { vendorId: vendorUser.id, name: "Seed Branch", city: "Amman", address: "Mecca St" }
    });

    const service = await prisma.service.create({
        data: { name: "hot_desk", unit: "hour" }
    });

    const vendorService = await prisma.vendorService.create({
        data: { branchId: branch.id, serviceId: service.id, maxCapacity: 10, pricePerUnit: 15, priceUnit: "hour" }
    });

    const facility = await prisma.facility.create({
        data: { name: "WiFi", icon: "wifi" }
    });

    const feature = await prisma.feature.create({
        data: { name: "Whiteboard", icon: "board" }
    });

    console.log('\n=======================================');
    console.log('      STARTING FULL API TEST SUITE       ');
    console.log('=======================================\n');

    async function req(method: string, path: string, body?: any) {
        console.log(`> [${method}] ${path}`);
        try {
            const res = await fetch(`${baseUrl}${path}`, {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : {},
                body: body ? JSON.stringify(body) : undefined
            });

            const text = await res.text();
            let data: any = text;
            try { data = JSON.parse(text); } catch (e) { }

            const statusEmoji = res.ok ? '✅' : '❌';
            console.log(`  ${statusEmoji} Status: ${res.status}`);
            if (!res.ok || method === 'GET') console.log(`  📦 Response:`, JSON.stringify(data));
            console.log('---------------------------------------');
            return data;
        } catch (e: any) {
            console.log(`  ❌ Error:`, e.message);
            console.log('---------------------------------------');
        }
        return null;
    }

    // 1. Authentication & Users
    console.log('\n[1] AUTHENTICATION & USERS');
    await req('POST', '/api/auth/register', { fullName: "Test User", email: "test2@example.com", phoneNumber: "+123456789", password: "password123", role: "customer" });
    await req('POST', '/api/auth/verify-otp', { phoneNumber: "+123456789", otpCode: "1234", purpose: "registration" });
    await req('POST', '/api/auth/login', { email: "test2@example.com", password: "password123" });
    await req('POST', '/api/auth/resend-otp', { phoneNumber: "+123456789", purpose: "registration" });
    await req('GET', '/api/users/profile');
    await req('PUT', '/api/users/profile', { fullName: "Updated Test User" });

    // 2. Customer Domain
    console.log('\n[2] CUSTOMER DOMAIN');
    await req('GET', '/api/branches?city=Amman');
    await req('GET', `/api/branches/${branch.id}`);
    await req('POST', '/api/availability/check', { vendorServiceId: vendorService.id, startTime: "2026-02-27T10:00:00Z", endTime: "2026-02-27T12:00:00Z", quantity: 1 });
    const bookingRes = await req('POST', '/api/bookings', { branchId: branch.id.toString(), vendorServiceId: vendorService.id.toString(), startTime: "2026-02-27T10:00:00Z", endTime: "2026-02-27T12:00:00Z", quantity: 1, paymentMethod: "credit_card", customerId: customerUser.id });
    await req('GET', '/api/bookings/my');
    if (bookingRes && bookingRes.id) await req('POST', `/api/bookings/${bookingRes.id}/cancel`);

    // 3. Vendor Domain
    console.log('\n[3] VENDOR DOMAIN');
    await req('POST', '/api/vendors/register', { companyName: "Test Vendor" });
    await req('GET', '/api/vendors/dashboard');
    await req('GET', '/api/vendor-services');
    await req('PUT', `/api/vendor-services/${vendorService.id}/price`, { pricePerUnit: 30, priceUnit: "hour" });
    await req('POST', `/api/vendor-services/${vendorService.id}/capacity-request`, { newCapacity: 10, reason: "Expanding office space", vendorId: vendorUser.id, branchId: branch.id });
    await req('PUT', '/api/availability', { vendorServiceId: vendorService.id, date: "2026-02-27", slots: [] });
    await req('GET', '/api/vendors/bookings');
    if (bookingRes && bookingRes.id) await req('PATCH', `/api/bookings/${bookingRes.id}/status`, { status: "completed" });

    // 4. Admin Domain
    console.log('\n[4] ADMIN DOMAIN');
    await req('GET', '/api/admin/approval-requests');
    // We need an approval request ID
    const approvalRes = await prisma.approvalRequest.findFirst();
    if (approvalRes) await req('POST', `/api/admin/approval-requests/${approvalRes.id}/review`, { decision: "approved", reviewNotes: "Looks good", adminId: adminUser.id });
    await req('GET', '/api/admin/branches');
    await req('PATCH', `/api/admin/branches/${branch.id}/status`, { status: "suspended" });
    await req('GET', '/api/admin/vendors');
    await req('PATCH', `/api/admin/vendors/${vendorUser.id}/status`, { status: "suspended" });
    await req('GET', '/api/admin/analytics');

    // 5. Shared & Core Systems
    console.log('\n[5] SHARED & CORE SYSTEMS');
    await req('GET', '/api/cities');
    await req('GET', '/api/facilities');
    await req('GET', '/api/features');
    await req('POST', '/api/ai/recommend', { query: "A quiet deep work space", location: "Amman", time: "2026-02-27T10:00:00Z", duration: 2 });
    await req('PUT', `/api/branches/${branch.id}/facilities`, { facilities: [{ facilityId: facility.id, isAvailable: true }] });
    await req('PUT', `/api/vendor-services/${vendorService.id}/features`, { features: [{ featureId: feature.id, quantity: 2 }] });

    console.log('\n=======================================');
    console.log('         API TESTS COMPLETED           ');
    console.log('=======================================\n');

    await prisma.$disconnect();
    await app.close();
}

testAllApis();
