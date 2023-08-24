import { PrismaClient } from '@prisma/client';
import { roleSeed } from '../prisma/role.seed';
import { ROLE_TYPE } from '../interfaces';
import * as moment from 'moment';
import { AppUtilities } from '../../app.utilities';

async function seedDatabase() {
  const tenantPrisma = new PrismaClient();
  const promises = [];

  try {
    // Hash the password asynchronously
    const hashedPassword = (await AppUtilities.hasher('Admin@123')) as string;

    // Seed roles
    promises.push(
      tenantPrisma.role.createMany({
        data: roleSeed,
        skipDuplicates: true,
      }),
    );

    // Fetch the ADMIN role
    const role = await tenantPrisma.role.findFirst({
      where: { code: ROLE_TYPE.ADMIN },
    });

    // Create a user with the hashed password
    promises.push(
      tenantPrisma.user.create({
        data: {
          email: 'admin@mail.com',
          password: hashedPassword,
          roleId: role.id,
          createdAt: moment().toISOString(),
        },
      }),
    );

    // Execute all promises concurrently
    await Promise.all(promises);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close the Prisma client connection
    await tenantPrisma.$disconnect();
  }
}

// Call the async seed function
seedDatabase();
