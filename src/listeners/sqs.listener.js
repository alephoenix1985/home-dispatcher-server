import { pollMessages } from "../helpers/poll.helper.js";
import { envConfig } from "../config/env.config.js";
import { processResultMessage } from "../helpers/request.helper.js";
import { getSqsQueueUrl } from "psf-core/services/aws/aws-sqs.service.js";
import { getSnsTopicArn } from "psf-core/services/aws/aws-sns.service.js";
import { logSection } from "psf-core/services/logger.service.js";

const logger = logSection('SQS-LISTENER');

/**
 * @fileoverview SQS Queue Listener.
 * This module is responsible for continuously polling an SQS queue,
 * processing messages by delegating to the appropriate data controller method,
 * and managing the message lifecycle (deletion on success).
 */

// Use the centralized config
const snsResults = envConfig.sqs.resultsTopicArn && getSnsTopicArn(envConfig.sqs.resultsTopicArn);
const sqsRequests = envConfig.sqs.requestsQueueUrl && getSqsQueueUrl(envConfig.sqs.requestsQueueUrl);

/**
 * @async
 * @function startListening
 * @description Initiates the long-polling loop to continuously listen for messages on the SQS queue.
 */
export const startListening = async () => {
    logger.info('SQS Listener starting...');
    logger.info(`${sqsRequests} starting...`);
    pollMessages({
        queueUrl: sqsRequests,
        snsTopicArn: snsResults,
        maxNumberOfMessage: envConfig.polling.maxNumberOfMessages,
        visibilityTimeout: envConfig.polling.visibilityTimeout,
        waitTimeSeconds: envConfig.polling.waitTimeSeconds,
        processMessage: processResultMessage,
    });
    // Example for Dead Letter Queue
    // pollMessages({
    //     queueUrl: envConfig.sqs.deadLetterQueueUrl,
    //     snsTopicArn: envConfig.sqs.resultsTopicArn,
    // });
};
