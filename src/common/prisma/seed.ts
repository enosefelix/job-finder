import { PrismaClient } from '@prisma/client';
import { roleSeed } from '../prisma/role.seed';
import { ROLE_TYPE } from '../interfaces';
import * as moment from 'moment';
import { AppUtilities } from '../../app.utilities';
import { job_listingSeed } from './jobs-seed-data.seed';

async function seedDatabase() {
  const tenantPrisma = new PrismaClient();
  const promises = [];

  try {
    const hashedPassword = (await AppUtilities.hasher('Admin@123')) as string;
    const email = 'admin@mail.com';

    // Seed roles
    await tenantPrisma.role.createMany({
      data: roleSeed,
      skipDuplicates: true,
    });

    // Fetch the ADMIN role
    const role = await tenantPrisma.role.findFirst({
      where: { code: ROLE_TYPE.ADMIN },
    });

    // delete previous job-listings
    await tenantPrisma.jobListing.deleteMany({});

    // Seed job-listings
    await tenantPrisma.jobListing.createMany({
      data: job_listingSeed,
      skipDuplicates: true,
    });

    const user = await tenantPrisma.user.create({
      data: {
        email,
        password: hashedPassword,
        roleId: role.id,
        createdAt: moment().toISOString(),
        profile: {
          create: {
            firstName: ROLE_TYPE.ADMIN,
            lastName: '',
            email,
          },
        },
      },
    });

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
