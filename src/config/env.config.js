import { createRequire } from 'module';

if (!process.env.NODE_ENV) {
    const require = createRequire(import.meta.url);
    const dotenv = require('dotenv');
    const fs = require('fs');
    const path = require('path');

    const envArg = process.argv[2];
    let envFileToLoad = '.env';

    if (envArg) {
        const normalizedArg = envArg.toLowerCase();
        let potentialFile;

        switch (normalizedArg) {
            case 'production':
            case 'prod':
                potentialFile = '.env.prod';
                break;
            case 'development':
            case 'dev':
                potentialFile = '.env.dev';
                break;
            case 'local':
                potentialFile = '.env.local';
                break;
            default:
                potentialFile = `.env.${normalizedArg}`;
                break;
        }

        if (fs.existsSync(path.resolve(process.cwd(), potentialFile))) {
            envFileToLoad = potentialFile;
        }
    }

    const envPath = path.resolve(process.cwd(), envFileToLoad);

    if (fs.existsSync(envPath)) {
        console.log(`Loading environment variables from: ${envFileToLoad}`);
        dotenv.config({ path: envPath });
    }
}
/**
 * Centralized configuration object for all environment variables.
 * Provides default values for non-critical settings to ensure the application
 * can run in a development environment without a full .env file.
 */
export const envConfig = {
    /**
     * Application-level settings
     */
    app: {
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        debugMode: process.env.DEBUG_MODE === 'true',
        port: process.env.PORT || '3000',
        defaultPaginateLimit: process.env.DEFAULT_PAGINATE_LIMIT ? parseInt(process.env.DEFAULT_PAGINATE_LIMIT, 10) : 10,
    },
    /**
     * MongoDB connection URI
     */
    db: {
        mongo: {
            uri: process.env.MONGO_URI,
            dbName: process.env.MONGO_DB_NAME || 'psfDB',
            // Placeholder for any future MongoDB client options
            options: {
                // Example: useNewUrlParser: true, useUnifiedTopology: true
            }
        },
    },
    aws: {
        sqs: {
            queueName: {
                dbResult: process.env.SQS_RESULTS_QUEUE,
                dbResultDL: process.env.SQS_DEAD_LETTER_QUEUE
            }
        }
    },

    /**
     * Redis connection settings
     */
    redis: {
        defaultTtl: process.env.REDIS_DEFAULT_TTL_SECONDS ? parseInt(process.env.REDIS_DEFAULT_TTL_SECONDS, 10) : 300, // 5 minutes
    },
};
