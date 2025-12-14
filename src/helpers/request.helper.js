import { dataController } from '../controllers/data.controller.js';
import { logSection } from 'psf-core-node/services/logger-node.service.js';
import { envConfig } from '../config/env.config.js';
import { cache as redisClient } from 'psf-core-node/services/cache.service.js';
import {parseSqsMessage} from "psf-core-node/services/aws/aws-sqs.service.js";

const logger = logSection('REQUEST-HELPER');

const actions = {
    // Standard CRUD
    get: dataController.get,
    getAll: dataController.getAll,
    getById: dataController.getById,
    set: dataController.set,
    setNew: dataController.setNew,
    upsert: dataController.upsert,
    del: dataController.del,
    delById: dataController.delById,

    // Advanced Operations
    aggregate: dataController.aggregate,
    bulk: dataController.bulk,
    transaction: dataController.transaction,
    createIndex: dataController.createIndex,

    // Migration System
    addMigration: dataController.addMigration,
    getMigrations: dataController.getMigrations,
    runMigration: dataController.runMigration,
    createSnapshot: dataController.createSnapshot,
};

/**
 * Caches a result (success or error) in Redis.
 * @param {string} correlationId - The unique ID for the request.
 * @param {object} payload - The payload to cache (containing status, data, or error).
 * @param {number} [ttl] - The time-to-live for the cache entry in seconds.
 */
const cacheResponse = async (correlationId, payload, ttl) => {
    const redisKey = `response:${correlationId}`;
    const cacheTTL = ttl || envConfig.redis.defaultTtlSeconds;

    try {
        // The cache service handles JSON stringification internally.
        await redisClient.set(redisKey, payload, cacheTTL);
        logger.info(`Successfully cached response for correlationId: ${correlationId}`, { ttl: `${cacheTTL}s` });
    } catch (redisError) {
        logger.error(`CRITICAL: Failed to cache response for correlationId: ${correlationId}`, { error: redisError });
        throw new Error(`Failed to write to Redis: ${redisError.message}`);
    }
};

/**
 * Processes a message from SQS, executes the corresponding database action,
 * and stores the result in Redis cache with a correlationId.
 * @param {object} rawSqsMessage - The raw message object received from SQS.
 */
export const processResultMessage = async (rawSqsMessage) => {
    const messageData = parseSqsMessage(rawSqsMessage);

    if (!messageData) {
        return; // Error is already logged by parseSqsMessage
    }

    const { action, payload, correlationId, ttl } = messageData;

    if (!correlationId) {
        logger.error(`Message is missing 'correlationId'. Discarding message.`, { message: messageData });
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
        const req = { body: payload };
        const res = {
            status: (statusCode) => ({
                json: async (body) => {
                    if (statusCode >= 400) {
                        logger.error(`Controller action failed with status ${statusCode}`, { body, correlationId });
                        const errorPayload = { status: 'error', error: body.error || `Controller failed with status ${statusCode}` };
                        await cacheResponse(correlationId, errorPayload, ttl);
                    } else {
                        logger.debug(`Controller action succeeded with status ${statusCode}`, { correlationId });
                        const successPayload = { status: 'success', data: body.data };
                        await cacheResponse(correlationId, successPayload, ttl);
                    }
                },
            }),
        };

        await actions[action](req, res);

    } catch (error) {
        logger.error(`An unexpected error occurred while processing action '${action}' for ${correlationId}`, { error: error.message });
        await cacheResponse(correlationId, { status: 'error', error: error.message || 'An unexpected error occurred.' }, ttl);
    }
};
