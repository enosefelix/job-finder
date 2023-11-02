import { PrismaClient } from '@prisma/client';
import { roleSeed } from '../prisma/role.seed';
import { ROLE_TYPE } from '../interfaces';
import * as moment from 'moment';
import { job_listingSeed } from './jobs-seed-data.seed';
import { AppUtilities } from '../../app.utilities';
import { blogSeed } from './blog-seed-data.seed';
import { Logger } from '@nestjs/common';

async function seedDatabase() {
  const prisma = new PrismaClient();
  const promises = [];

  const logger = new Logger('seedDatabase');

  try {
    const hashedPassword = (await AppUtilities.hasher('Iwia12345')) as string;
    const email = 'iwiaadmin123@getnada.com';

    const foundUser = await prisma.user.findUnique({
      where: { email },
    });

    // Seed roles
    logger.debug('Seeding roles...');
    await prisma.role.createMany({
      data: roleSeed,
      skipDuplicates: true,
    });
    logger.debug('Roles seeding complete...\n\n');

    // Fetch the ADMIN role
    const role = await prisma.role.findFirst({
      where: { code: ROLE_TYPE.ADMIN },
    });

    // Seed job-listings
    logger.debug('Seeding job listings...');
    for (const job of job_listingSeed) {
      try {
        await prisma.jobListing.upsert({
          where: { id: job.id },
          create: job,
          update: {},
        });
        console.log(`Job listing created ${job.title}`);
      } catch (error) {
        console.error('Error seeding job listing', error);
      }
    }
    logger.debug('Job listing seeding complete...\n\n');

    await prisma.user.create({
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

    const findUser = await prisma.user.findFirst({
      where: { email, role: { code: ROLE_TYPE.ADMIN } },
    });

    // Seed blogs
    logger.debug('Seeding blogs');
    for (const blog of blogSeed) {
      try {
        await prisma.blog.upsert({
          where: { id: blog.id },
          create: {
            ...blog,
            author: { connect: { id: findUser.id } },
            readTime: '1 minute read',
          } as any,
          update: {
            image: blog.image,
          },
        });
        console.debug(`blog created: ${blog.title}`);
      } catch (error) {
        console.error('Error seeding job listing', error);
      }
    }
    logger.debug('Blogs seeding complete...\n\n');

    for (const job of job_listingSeed) {
      try {
        await prisma.jobListing.update({
          where: { id: job.id },
          data: {
            createdBy: foundUser.id,
          },
        }),
          console.log(`Job listing updated ${job.title}`);
      } catch (error) {
        console.error('Error seeding job listing', error);
      }
    }

    for (const blog of blogSeed) {
      try {
        await prisma.blog.update({
          where: { id: blog.id },
          data: {
            createdBy: foundUser.id,
          },
        }),
          console.log(`Job listing created ${blog.title}`);
      } catch (error) {
        console.error('Error seeding job listing', error);
      }
    }

    // Seed user
    logger.debug('Seeding user...');
    const user = await prisma.user.upsert({
      where: { id: findUser.id },
      create: {
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
      update: {},
    });
    logger.debug('User seeding complete...\n\n');

    await Promise.all(promises);
  } catch (error) {
    if (error) {
      console.error('Error seeding database:', error);
    } else {
      // Close the Prisma client connection
      console.log('Seeding done.');
      await prisma.$disconnect();
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Call the async seed function
seedDatabase();
