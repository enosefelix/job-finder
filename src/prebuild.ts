import * as dotenv from 'dotenv';

dotenv.config();

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
}

const DATABASEURL = process.env.DATABASEURL;
console.log('🚀 ~ file: prebuild.ts:6 ~ DATABASEURL:', DATABASEURL);
