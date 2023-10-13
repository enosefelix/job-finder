import * as dotenv from 'dotenv';

// dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

const rootDir = path.resolve(__dirname, '..'); // Assuming your script is in the src directory

// Set the process.cwd() to the root directory
process.chdir(rootDir);

const envFilePath = path.join(rootDir, '.env');

if (fs.existsSync(envFilePath)) {
  console.log('.env file exists in the codebase.');
} else {
  console.error('.env file does not exist in the codebase.');
  if (fs.existsSync(envFilePath)) {
    console.log('.env file exists in the codebase.');
  } else {
    console.log('.env file does not exist in the codebase. Creating one...');

    // Create a sample content for the .env file
    const envFileContent = `DATABASEURL=your_database_url_here`;

    // Write the content to the .env file
    fs.writeFileSync(envFilePath, envFileContent);

    console.log('.env file created.');
  }
}

async function loadEnvVariables() {
  await dotenv.config();
  const DATABASEURL = process.env.DATABASEURL;
  console.log('🚀 ~ file: prebuild.ts:6 ~ DATABASEURL:', DATABASEURL);
}

// Call the function
loadEnvVariables();
