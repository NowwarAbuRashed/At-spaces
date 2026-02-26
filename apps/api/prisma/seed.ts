import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Cleanup ---');
    // Delete in reverse order of dependencies to avoid FK constraints
    await prisma.branchFacility.deleteMany();
    await prisma.facility.deleteMany();
    await prisma.serviceFeature.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.vendorService.deleteMany();
    await prisma.service.deleteMany();
    await prisma.approvalRequest.deleteMany();
    await prisma.otpSession.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data cleared.');

    console.log('\n--- Seeding Initial Data ---');

    // 1. Create Facilities
    console.log('Seeding Facilities...');
    await prisma.facility.createMany({
        data: [
            { name: 'WiFi', icon: 'wifi' },
            { name: 'Parking', icon: 'local_parking' },
            { name: 'Coffee', icon: 'coffee' },
            { name: 'Printer', icon: 'print' },
        ]
    });

    // 2. Create Services
    console.log('Seeding Services...');
    await prisma.service.createMany({
        data: [
            { name: 'hot_desk', description: 'Flexible desk in shared area', unit: 'seat' },
            { name: 'private_office', description: 'Private locked office space', unit: 'office' },
            { name: 'meeting_room', description: 'Bookable meeting room with AV', unit: 'room' },
        ]
    });

    // 3. Create Vendor and Branch
    console.log('Seeding Vendors and Branches...');
    const vendor1 = await prisma.user.create({
        data: {
            fullName: 'Al-Hassan Business Center',
            email: 'info@alhassan.jo',
            role: 'vendor',
            status: 'active',
            branches: {
                create: [
                    {
                        name: 'Al-Hassan Amman - Abdali',
                        city: 'Amman',
                        address: 'Abdali Boulevard, Tower 2',
                        status: 'active',
                    },
                    {
                        name: 'Al-Hassan Aqaba - Port Village',
                        city: 'Aqaba',
                        address: 'King Hussein St, Near Port',
                        status: 'active',
                    }
                ]
            }
        }
    });

    const vendor2 = await prisma.user.create({
        data: {
            fullName: 'Petra Coworking Space',
            email: 'hello@petraspace.jo',
            role: 'vendor',
            status: 'active',
            branches: {
                create: {
                    name: 'Petra Amman - Rainbow St',
                    city: 'Amman',
                    address: 'Rainbow Street, Building 45',
                    status: 'active',
                }
            }
        }
    });

    // 4. Create Customers
    console.log('Seeding Customers...');
    await prisma.user.create({
        data: {
            fullName: 'Ahmad Jordan',
            email: 'ahmad.jordan@example.jo',
            role: 'customer',
            status: 'active',
        }
    });

    await prisma.user.create({
        data: {
            fullName: 'Layla Office',
            email: 'layla.office@example.jo',
            role: 'customer',
            status: 'active',
        }
    });

    console.log('\n--- Seeding Complete Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
