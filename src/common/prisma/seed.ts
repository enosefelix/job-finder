import { PrismaClient } from '@prisma/client';
import { roleSeed } from '../prisma/role.seed';
import { ROLE_TYPE } from '../interfaces';
import * as moment from 'moment';
import { job_listingSeed } from './jobs-seed-data.seed';
import { AppUtilities } from '../../app.utilities';

async function seedDatabase() {
  const prisma = new PrismaClient();
  const promises = [];

  try {
    // const hashedPassword = (await AppUtilities.hasher('Admin@123')) as string;
    // const email = 'admin@mail.com';
    const hashedPassword = (await AppUtilities.hasher('Iwia12345')) as string;
    const email = 'admin@iwia.com';

    // Seed roles
    await prisma.role.createMany({
      data: roleSeed,
      skipDuplicates: true,
    });

    // Fetch the ADMIN role
    const role = await prisma.role.findFirst({
      where: { code: ROLE_TYPE.ADMIN },
    });

    // // delete previous job-listings
    // await prisma.jobListingApplications.deleteMany({});

    // // delete previous job-listings
    // await prisma.jobListing.deleteMany({});

    // Seed job-listings
    // for (const job of job_listingSeed) {
    //   try {
    //     await prisma.jobListing.create({ data: job });
    //     console.debug(`Job listing created ${job.title}`);
    //   } catch (error) {
    //     console.error('Error seeding job listing', error);
    //   }
    // }

    const user = await prisma.user.create({
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
    console.log('Seeding done.');

    await prisma.$disconnect();
  }
}

// Call the async seed function
seedDatabase();
