// src/controllers/queue.error.controller.js
import logger from '../services/logger.service.js';

/**
 * @fileoverview Queue Error Controller.
 * This is designed to handle messages that have failed processing multiple times
 * and have been moved to a Dead Letter Queue (DLQ).
 * In a real-world scenario, a separate process or Lambda function would listen to the DLQ
 * and invoke this handler.
 */

/**
 * @async
 * @function handleDeadLetter
 * @description Processes a message from the DLQ. It logs the failure for analysis and can notify administrators.
 * @param {object} message - The failed message from the DLQ.
 */
export const handleDeadLetter = async (message) => {
    logger.error('Processing message from Dead Letter Queue.', {
        messageId: message.MessageId,
        body: message.Body,
    });

    // Optionally, notify an admin team via another SNS topic or other alert system.
    const notification = {
        status: 'FAILED_PERMANENTLY',
        details: 'A message failed all processing attempts and was moved to the DLQ.',
        originalMessage: JSON.parse(message.Body),
    };

    // Example: Publishing the failure report to the same results topic for traceability
    await publishResult(notification);

    // Here you could also save the failed message to a separate "failures" collection
    // in MongoDB for later manual review or reprocessing.
};