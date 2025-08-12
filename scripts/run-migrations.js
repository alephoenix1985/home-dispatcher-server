import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

// --- Environment Configuration ---
const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
const defaultEnvPath = path.resolve(process.cwd(), '.env');

// Load environment-specific .env file if it exists, otherwise load default .env
if (fs.existsSync(envPath)) {
    console.log(`Loading environment variables from: ${envPath}`);
    dotenv.config({ path: envPath });
} else {
    console.log(`Loading environment variables from: ${defaultEnvPath}`);
    dotenv.config({ path: defaultEnvPath });
}
// --- End Environment Configuration ---

const migrationsDir = path.join(process.cwd(), 'src', 'migrations');

console.log(`Searching for seed files in: ${migrationsDir}`);

try {
    const allFiles = fs.readdirSync(migrationsDir);
    const seedFiles = allFiles.filter(file => file.endsWith('.seed.js'));

    if (seedFiles.length === 0) {
        console.log('No seed files found to execute.');
        process.exit(0);
    }

    console.log(`Found ${seedFiles.length} seed file(s) to execute:`, seedFiles);

    for (const file of seedFiles) {
        const filePath = path.join(migrationsDir, file);
        console.log(`\n--------------------------------------------------`);
        console.log(`Executing: ${file}`);
        console.log(`--------------------------------------------------`);
        // The child process will inherit the environment variables loaded by dotenv
        execSync(`node ${filePath}`, { stdio: 'inherit' });
        console.log(`Finished executing: ${file}`);
    }

    console.log('\nAll seed scripts executed successfully.');

} catch (error) {
    console.error('\nAn error occurred during the migration process. The process has been stopped.');
    process.exit(1);
}
