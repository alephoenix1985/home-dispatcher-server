import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

/**
 * @fileoverview This script generates a docker-compose.yml file for production
 * by injecting environment variables from a .env file into a template.
 */
const APP_ID = 'psf-db'
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const outputPath = path.join(projectRoot, 'docker-compose.generated.yml');

const defaultComposeTemplate = `
services:
  app:
    image: ghcr.io/phoenix-software-factory/${APP_ID}:latest
    container_name: ${APP_ID}-service
    restart: always
    labels:
      - "com.centurylinklabs.watchtower.scope=<SCOPE_PLACEHOLDER>"
    # The environment variables below will be generated from your .env file.
    environment:

  watchtower:
    image: containrrr/watchtower
    container_name: watchtower
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_INCLUDE_RESTARTING=true
    command: --interval 300 --scope <SCOPE_PLACEHOLDER>
`;

/**
 * Parses the content of a .env file into a key-value object.
 * @param {string} fileContent The content of the .env file.
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
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
                value = value.slice(1, -1);
            envVars[key] = value;
        }
    }
    return envVars;
};


/**
 * Main function to generate the docker-compose file.
 */
const generateCompose = () => {
    const envArg = process.argv[2] || 'prod';
    let envName;
    let tagSuffix;

    switch (envArg.toLowerCase()) {
        case 'production':
        case 'prod':
        case 'main':
            envName = 'prod';
            tagSuffix = 'prod';
            break;
        case 'development':
        case 'dev':
            envName = 'dev';
            tagSuffix = 'dev';
            break;
        default:
            const sanitized = envArg.replace(/[^a-zA-Z0-9.-]/g, '-');
            envName = sanitized;
            tagSuffix = sanitized;
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

    console.log(`Generating docker-compose file for environment: '${tagSuffix}' using ${path.basename(envPath)}`);

    const imageName = `ghcr.io/phoenix-software-factory/${APP_ID}-${tagSuffix}:latest`;
    const appContainerName = `${APP_ID}-${tagSuffix}-service`;
    const watchtowerContainerName = `${APP_ID}-${tagSuffix}-watchtower`;
    const templateContent = defaultComposeTemplate.replace(
        `ghcr.io/phoenix-software-factory/${APP_ID}:latest`,
        imageName
    ).replace(
        `container_name: ${APP_ID}-service`,
        `container_name: ${appContainerName}`
    ).replace(
        'container_name: watchtower',
        `container_name: ${watchtowerContainerName}`
    );

    const finalTemplate = templateContent.replace(/<SCOPE_PLACEHOLDER>/g, watchtowerContainerName);

    const envContent = fs.readFileSync(envPath, 'utf-8');
    const envVars = parseEnv(envContent);

    const environmentLines = [];
    for (const key in envVars) {
        if (Object.prototype.hasOwnProperty.call(envVars, key)) {
            environmentLines.push(`      - ${key}=${envVars[key]}`);
        }
    }

    const newEnvironmentBlock = `    environment:\n${environmentLines.join('\n')}`;

    let outputContent = finalTemplate.replace(
        /^\s*environment:(?:.|\n)*?(?=\n\S|$)/m,
        newEnvironmentBlock
    );

    outputContent = outputContent.replace(/(MONGO_URI=mongodb:\/\/)([^/:]+)(.*)/g, '$1mongos-router$3');
    outputContent = outputContent.replace(/(REDIS_URL=redis:\/\/)([^/:]+)(.*)/g, '$1redis-server-secure$3');
    fs.writeFileSync(outputPath, outputContent, 'utf-8');

    console.log(`Successfully generated ${outputPath}`);
};

generateCompose();