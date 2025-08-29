import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @fileoverview This script generates a docker config.json file for Watchtower
 * to authenticate with private registries like GHCR.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

/**
 * Parses the content of a .env file into a key-value object.
 * @param {string} fileContent The content of a .env file.
 * @returns {Object<string, string>} An object with the parsed environment variables.
 */
const parseEnv = (fileContent) => {
    const envVars = {};
    const lines = fileContent.toString().split('\n');

    for (const line of lines) {
        if (line.trim() === '' || line.startsWith('#')) {
            continue;
        }
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    }
    return envVars;
};

/**
 * Main function to generate the watchtower config file.
 */
const generateConfig = () => {
    const envArg = process.argv[2] || 'prod';
    let envName;

    switch (envArg.toLowerCase()) {
        case 'production':
        case 'prod':
        case 'main':
            envName = 'prod';
            break;
        case 'development':
        case 'dev':
            envName = 'dev';
            break;
        default:
            envName = envArg.replace(/[^a-zA-Z0-9.-]/g, '-');
            break;
    }

    let envPath = path.join(projectRoot, `.env.${envName}`);
    if (!fs.existsSync(envPath)) {
        console.log(`Specific environment file .env.${envName} not found. Falling back to .env`);
        envPath = path.join(projectRoot, '.env');
    }

    if (!fs.existsSync(envPath)) {
        console.error(`Error: No .env file found. Looked for .env.${envName} and .env. Please create one.`);
        process.exit(1);
    }

    console.log(`Generating watchtower config for '${envName}' using ${path.basename(envPath)}`);

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = parseEnv(envContent);

    const { GH_USER, GH_PAT } = envVars;

    if (!GH_USER || !GH_PAT) {
        console.error('Error: GH_USER and/or GH_PAT not found in environment file. Cannot generate auth config.');
        process.exit(1);
    }

    const authString = Buffer.from(`${GH_USER}:${GH_PAT}`).toString('base64');
    const dockerConfig = { auths: { 'ghcr.io': { auth: authString } } };

    const outputPath = path.join(projectRoot, `watchtower-config.json`);
    fs.writeFileSync(outputPath, JSON.stringify(dockerConfig, null, 2), 'utf-8');

    console.log(`Successfully generated Watchtower config at ${outputPath}`);
    console.log(`Note: Ensure this file is placed at the host path specified in your docker-compose.generated.yml volume.`);
};

generateConfig();