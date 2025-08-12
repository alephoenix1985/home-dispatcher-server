// src/config/index.js
import dotenv from 'dotenv';

dotenv.config();

/**
 * @fileoverview Loads and exports all environment variables from the .env file.
 * This provides a single source of truth for configuration throughout the application.
 */
export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    debugMode: process.env.DEBUG_MODE === 'true',
    mongoURI: process.env.MONGO_URI,
    aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    sqs: {
        mainQueueUrl: process.env.MAIN_SQS_QUEUE_URL,
        deadLetterQueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
        maxRetries: parseInt(process.env.SQS_MAX_RETRIES, 10) || 3,
        visibilityTimeout: parseInt(process.env.SQS_VISIBILITY_TIMEOUT, 10) || 30,
        waitTimeSeconds: parseInt(process.env.SQS_WAIT_TIME_SECONDS, 10) || 20,
        maxNumberOfMessage: process.env.DEFAULT_COUNT_MESSAGES ?? 10
    },
    sns: {
        resultsTopicArn: process.env.RESULTS_SNS_TOPIC_ARN,
    },
    cloudwatch: {
        logGroupName: process.env.CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: process.env.CLOUDWATCH_LOG_STREAM_NAME,
    }
};