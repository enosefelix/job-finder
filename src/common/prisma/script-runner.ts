import { exec } from 'child_process';
import * as readline from 'readline';

const scripts = [
  // 'db.migration',
  'npm.install',
  // 'ts.node',
  // 'db.seed',
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
