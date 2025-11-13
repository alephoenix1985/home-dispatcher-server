import {dataController} from '../controllers/data.controller.js';
import {logSection} from 'psf-core/node/services/logger.service.js';
import {authMiddleware} from "psf-core/node/middlewares/auth.middleware.js";

const logger = logSection('API-GATEWAY-HELPER');

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

const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
});

export const handleApiGatewayRequest = async (event) => {
    const {body} = event;
    let authError = null;
    await authMiddleware(event, null, (err) => {
        authError = err;
    });
    if (authError) {
        return createResponse(401, {error: authError.message || 'Unauthorized'});
    }
    try {
        if (!body) {
            return createResponse(400, { error: 'Request body is missing.' });
        }

        const { action, payload = {}, collection } = JSON.parse(body);

        if (!collection) {
            return createResponse(400, { error: "Request body must include a 'collection' property." });
        }
        
        const actionFn = actions[action];

        if (!actionFn) {
            logger.warn(`Unsupported action: ${action}`);
            return createResponse(400, {error: `Action '${action}' is not supported.`});
        }

        logger.info(`Processing API request for action '${action}' on collection '${collection}'`);

        const req = {
            body: {
                ...payload,
                collection,
            },
            params: {
                ...event.pathParameters,
                collection,
                id: payload.id || event.pathParameters?.id,
            },
            query: payload.query || {},
        };

        let responseData = null;
        let responseStatus = 200;
        const res = {
            status: (statusCode) => (responseStatus = statusCode, {
                json: (data) => {
                    responseData = data;
                },
            }),
        };

        await actionFn(req, res);

        // Log the final response before sending
        const finalResponse = createResponse(responseStatus, responseData);
        logger.info('Final API Gateway response being sent:', { response: finalResponse });

        return finalResponse;

    } catch (error) {
        if (error instanceof SyntaxError) {
            logger.error('Failed to parse request body.', {body});
            return createResponse(400, {error: 'Invalid JSON in request body.'});
        }

        logger.error(`An unexpected error occurred while processing API request`, {
            error: error.message,
            path: event.path
        });
        return createResponse(500, {error: error.message || 'An internal server error occurred.'});
    }
};
