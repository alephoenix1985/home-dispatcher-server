import { dataController } from '../controllers/data.controller.js';
import { logSection } from 'psf-core/services/logger.lambda.service.js';
import { envConfig } from '../config/env.config.js';
import { cache as redisClient } from 'psf-core/services/cache.service.js';

const logger = logSection('REQUEST-HELPER');

const actions = {
    aggregate: dataController.aggregate,
    bulk: dataController.bulk,
    del: dataController.del,
    delById: dataController.delById,
    get: dataController.get,
    getAll: dataController.getAll,
    getById: dataController.getById,
    set: dataController.set,
    setNew: dataController.setNew,
    transaction: dataController.transaction,
    upsert: dataController.upsert,
};

/**
 * Caches a result (success or error) in Redis.
 * @param {string} correlationId - The unique ID for the request.
 * @param {object} payload - The payload to cache (containing status, data, or error).
 * @param {number} [ttl] - The time-to-live for the cache entry in seconds.
 */
const cacheResponse = async (correlationId, payload, ttl) => {
    try {
        const redisKey = `response:${correlationId}`;
        const cacheTTL = ttl || envConfig.redis.defaultTtlSeconds;
        await redisClient.set(redisKey, payload, cacheTTL);
        logger.info(`Cached response for correlationId: ${correlationId}`, { ttl: `${cacheTTL}s` });
    } catch (redisError) {
        logger.error(`CRITICAL: Failed to cache response for correlationId: ${correlationId}`, { error: redisError });
        throw new Error(`Failed to write to Redis: ${redisError.message}`);
    }
};

/**
 * Processes a message from SQS, executes the corresponding database action,
 * and stores the result in Redis cache with a correlationId.
 * @param {import('aws-lambda').SQSRecord} sqsRecord - The raw message record received from SQS.
 */
export const processResultMessage = async (sqsRecord) => {
    let messageData;

    try {
        messageData = JSON.parse(sqsRecord.body);
    } catch (error) {
        logger.error('Failed to parse SQS message body. Discarding message.', {
            messageId: sqsRecord.messageId,
            body: sqsRecord.body,
            error: error.message
        });
        return;
    }

    const { action, payload, correlationId, ttl } = messageData;

    if (!correlationId) {
        logger.error("Message is missing 'correlationId'. Discarding message.", { messageBody: messageData });
        return; 
    }

    if (!action || !actions[action]) {
        const errorMsg = `Action '${action}' not found or is not valid.`;
        logger.error(errorMsg, { correlationId });
        await cacheResponse(correlationId, { status: 'error', error: errorMsg }, ttl);
        return; 
    }

    logger.info(`Processing action: '${action}' for correlationId: ${correlationId}`);
    logger.debug(`Payload for action '${action}':`, { payload });

    try {
        await new Promise((resolve, reject) => {
            const req = { body: payload };
            const res = {
            status: (statusCode) => ({
                json: async (body) => {
                        const isError = statusCode >= 400;
                        const responsePayload = isError
                            ? { status: 'error', error: body.error || `Controller failed with status ${statusCode}` }
                            : { status: 'success', data: body.data };
                        
                        await cacheResponse(correlationId, responsePayload, ttl);
                        isError ? reject(new Error(responsePayload.error)) : resolve();
                },
            }),
            };
            actions[action](req, res).catch(reject);
        });
    } catch (error) {
        logger.error(`An unexpected error occurred while processing action '${action}' for ${correlationId}`, { error: error.message });
        await cacheResponse(correlationId, { status: 'error', error: error.message || 'An unexpected error occurred.' }, ttl);
        throw error;
    }
};
