/**
 * AWS Lambda handler for the root endpoint.
 * @param {import('aws-lambda').APIGatewayEvent} event The event object.
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
export const handler = async (event) => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "Welcome db service",
  };
};
