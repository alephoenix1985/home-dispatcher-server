import hsDao from "psf-core-node/daos/hs.dao.js";

/**
 * AWS Lambda handler for retrieving service configuration.
 * @param {import('aws-lambda').APIGatewayEvent} event The event object.
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
export const handler = async (event) => {
  const services = hsDao.services;
  const serviceKey = event.pathParameters?.id; // URL param is still {id}, but maps to 'key' in DB

  if (!serviceKey) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing service key" }) };
  }

  try {
    // Fetch configuration for the requested service by key
    const serviceConfig = await services.get({ query: { key: serviceKey } });

    if (!serviceConfig) {
      return { statusCode: 404, body: JSON.stringify({ error: "Service not found" }) };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify(serviceConfig) 
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal Server Error" }) };
  }
};
