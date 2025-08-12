import dotenv from 'dotenv';
import path from 'path';

// This is a workaround to get __dirname in ES Modules
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the root of the project
dotenv.config({path: path.resolve(__dirname, '../../.env')});

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
    database: {
        mongoUri: process.env.MONGO_URI,
    },

    /**
     * Redis connection settings
     */
    redis: {
        url: process.env.REDIS_URL,
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
        password: process.env.REDIS_PASSWORD,
        defaultTtl: process.env.REDIS_DEFAULT_TTL_SECONDS ? parseInt(process.env.REDIS_DEFAULT_TTL_SECONDS, 10) : 300, // 5 minutes
    },

    /**
     * AWS credentials and configuration
     */
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        accountId: process.env.AWS_ACCOUNT_ID,
    },

    /**
     * SQS Queue and Topic configuration
     */
    sqs: {
        requestsQueueUrl: process.env.SQS_REQUESTS_QUEUE || process.env.MAIN_SQS_QUEUE_URL,
        resultsTopicArn: process.env.SNS_RESULTS_TOPIC_ARN || process.env.RESULTS_SNS_TOPIC_ARN,
        deadLetterQueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
    },

    /**
     * SQS Polling behavior settings
     */
    polling: {
        maxNumberOfMessages: parseInt(process.env.MAX_NUMBER_OF_MESSAGES || process.env.SQS_LISTENER_MAX_MESSAGES || '10', 10),
        visibilityTimeout: parseInt(process.env.VISIBILITY_TIMEOUT || process.env.SQS_VISIBILITY_TIMEOUT || '30', 10),
        waitTimeSeconds: parseInt(process.env.WAIT_TIME_SECONDS || process.env.SQS_WAIT_TIME_SECONDS || '20', 10),
        maxRetries: parseInt(process.env.SQS_MAX_RETRIES, 10) || 3,
    },

    /**
     * CloudWatch logging configuration
     */
    logging: {
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: process.env.CLOUDWATCH_LOG_STREAM_NAME,
    },
};
