import _ from "lodash";
import { receiveMessage, deleteMessage } from "psf-core/services/aws/aws-sqs.service.js";
import { logSection } from "psf-core/services/logger.service.js";

const logger = logSection('SQS_POLL');

/**
 * @function pollMessages
 * @description Polls for SQS messages, processes them concurrently, and deletes them upon success.
 * @param {object} params - Parameters for polling.
 */
export const pollMessages = async (params) => {
    try {
        const messages = await receiveMessage(params?.queueUrl, _.omitBy(params, _.isNil));

        if (messages && messages.length > 0) {
            logger.debug(`Received ${messages.length} messages.`);

            const processingPromises = messages.map(async (message) => {
                try {
                    await params.processMessage(message, params?.queueUrl, params.snsTopicArn);
                    await deleteMessage(params.queueUrl, message.ReceiptHandle);
                    logger.info(`Message processed and deleted successfully.`, { messageId: message.MessageId });
                } catch (error) {
                    logger.error(`Failed to process message. It will return to the queue.`, {
                        messageId: message.MessageId,
                        error: error.message,
                    });
                }
            });

            await Promise.all(processingPromises);
        }
    } catch (error) {
        logger.error('A critical error occurred during the SQS receiveMessage call:', error);
    } finally {
        setImmediate(() => pollMessages(params));
    }
};
