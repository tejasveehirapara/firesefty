const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const sidebar_data = [
    {
        screenName: "Dashboard",
        route: "/dashboard",
        order: 1,
    },
    {
        screenName: "Users",
        route: "/users",
        order: 2,
    },
    {
        screenName: "Products",
        route: "/products",
        order: 3,
    },
    {
        screenName: "Vendors",
        route: "/vendors",
        order: 4,
    },

    {
        screenName: "Purchases",
        route: "/purchases",
        order: 5,
    },
    {
        screenName: "Quotations",
        route: "/quotations",
        order: 6,
    },
    {
        screenName: "Inventory",
        route: "/inventory",
        order: 7,
    }

]

async function main() {
    const adminEmail = 'admin@yopmail.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            firstName: 'Admin',
            lastName: 'User',
            password: hashedPassword,
            role: 'ADMIN',
            phone: '1234567890',
        },
    });

    const screens = await prisma.screen.createMany({
        data: sidebar_data,
    });

    console.log({ admin, screens });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
