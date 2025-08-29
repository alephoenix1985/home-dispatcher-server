// import getClient from 'mongodb-atlas-api-client';
import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logSection } from 'psf-core/services/logger.service.cjs';

const logger = logSection('ATLAS-MIGRATION');

const {
    ATLAS_PUBLIC_KEY,
    ATLAS_PRIVATE_KEY,
    ATLAS_PROJECT_ID,
    ATLAS_CLUSTER_NAME,
    MONGO_DB_NAME
} = process.env;

/** Reads a configuration file and ensures that each Atlas Search index
 * defined in it exists, creating it if necessary, using the getClient pattern.
 * @async
 * @returns {Promise<void>} A Promise that resolves when the synchronization is complete.
 * @throws {Error} If there is a fatal error during synchronization or if the configuration file is invalid.
 */
export const ensureAtlasSearchIndexes = async () => {
    logger.info('Starting Atlas Search index synchronization.');

    if (!ATLAS_PUBLIC_KEY || !ATLAS_PRIVATE_KEY || !ATLAS_PROJECT_ID || !ATLAS_CLUSTER_NAME) {
        logger.warn('Missing Atlas Admin API credentials in .env. Skipping search index synchronization.');
        return;
    }

    try {
        const { atlasSearch } = getClient({
            publicKey: ATLAS_PUBLIC_KEY,
            privateKey: ATLAS_PRIVATE_KEY,
            projectId: ATLAS_PROJECT_ID,
            baseUrl: "https://cloud.mongodb.com/api/atlas/v1.0"
        });

        // 3. Leer el archivo de configuración de índices.
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const filePath = path.resolve(__dirname, '../config/atlas-search-migration.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const indexDefinitions = JSON.parse(fileContent);

        if (!Array.isArray(indexDefinitions)) {
            throw new Error('atlas-search-migration.json is not a valid array.');
        }

        logger.info(`Found ${indexDefinitions.length} Atlas Search index definitions to process.`);

        // 4. Procesar cada definición en paralelo.
        const allPromises = indexDefinitions.map(async (definition) => {
            const { indexName, collectionName, mappings } = definition;

            const existingIndexes = await atlasSearch.getAll(ATLAS_CLUSTER_NAME, MONGO_DB_NAME, collectionName);
            const existingIndex = existingIndexes.find(index => index.name === indexName);

            if (existingIndex) {
                logger.info(`✅ Index '${indexName}' on '${collectionName}' already exists. Skipping.`);
                return;
            }

            logger.info(`Index '${indexName}' not found. Creating...`);
            const newIndexPayload = {
                name: indexName,
                database: MONGO_DB_NAME,
                collectionName: collectionName,
                mappings: mappings
            };

            await atlasSearch.create(ATLAS_CLUSTER_NAME, newIndexPayload);

            logger.info(`✅ Successfully initiated creation of index '${indexName}'. It may take a few minutes to build.`);
        });

        await Promise.all(allPromises);

        logger.info('Atlas Search index synchronization complete.');

    } catch (error) {
        logger.error('Fatal error during Atlas Search index synchronization:');
        logger.error(error);
        throw error;
    }
};