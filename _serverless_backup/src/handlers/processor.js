import {processResultMessage} from '../../../src/helpers/request-lambda.helper.js';
import {logSection} from 'core/node/services/logger.service.js';
import {handleApiGatewayRequest} from '../../../src/helpers/api-gateway.helper.js';

const logger = logSection('SQS-PROCESSOR');

/**
 * AWS Lambda handler for processing SQS messages.
 * @param {import('aws-lambda').SQSEvent} event The SQS event object containing message records.
 */
export const handler = async (event) => {
    if (event.httpMethod) {
        return handleApiGatewayRequest(event);
    }

    logger.info(`Received ${event.Records.length} message(s) from SQS.`);

    const processingPromises = event.Records.map(async (record) => {
        try {
            await processResultMessage(record);
        } catch (error) {
            logger.error(`Failed to process message ${record.messageId}. It will be returned to the queue.`, {error: error.message});
            throw error; // Re-throw to mark the message as failed for SQS
        }
    });

    await Promise.all(processingPromises);
};