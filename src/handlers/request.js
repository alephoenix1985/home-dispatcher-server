import { handleApiGatewayRequest } from '../helpers/api-gateway.helper.js';
import { logSection } from 'psf-core-node/services/logger.service.js';

const logger = logSection('API-HANDLER');

/**
 * AWS Lambda handler for processing API Gateway events.
 * @param {import('aws-lambda').APIGatewayEvent} event The event object.
 */
export const handler = async (event) => {
  try {
    console.log("========== TRYING TO EXECUTE HANDLER ==========");
    logger.debug('Received API Gateway event:', { event });
    return await handleApiGatewayRequest(event);
  } catch (error) {
    console.error("!!! LAMBDA EXECUTION FAILED !!!", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error. Check the logs in the terminal.",
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
