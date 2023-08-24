import { exec } from 'child_process';
import * as readline from 'readline';
import { PrismaClient } from '@prisma/client';
import { roleSeed } from '../prisma/role.seed';
import { ROLE_TYPE } from '../interfaces';
import * as moment from 'moment';
import { AppUtilities } from '../../app.utilities';

const scripts = [
  // 'db.migration',
    "prisma.generate",
  //'npm.install',
  //'yarn.install',
  // 'ts.node',
  // 'node',
  'db.migration.run',
  'db.generate',
  // 'build',
];

async function runScript(script) {
  return new Promise<void>((resolve, reject) => {
    console.log(`Running script: ${script}`);

    const childProcess = exec(`npm run ${script}`);

    childProcess.stdout.on('data', (data) => {
      console.log(data);
    });

    const automaticResponses = ['initial_migration'];
    let responseIndex = 0;

    if (script === 'db.migration') {
      childProcess.stdout.once('data', () => {
        childProcess.stdin.write(automaticResponses[responseIndex++] + '\n');
      });
    }

    childProcess.stderr.on('data', (data) => {
      console.error(data);
    });

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${script} completed successfully.`);
        resolve();
      } else {
        console.error(`Script ${script} failed with exit code ${code}.`);
        reject(new Error(`Script ${script} failed with exit code ${code}.`));
      }
    });
  });
}

async function runScriptsSequentially() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  for (const script of scripts) {
    try {
      await runScript(script);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    console.log('All scripts have been run.');
  }
}

runScriptsSequentially();

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
