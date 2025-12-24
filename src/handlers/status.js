import hsDao from "psf-core-node/daos/hs.dao.js";

/**
 * AWS Lambda handler for retrieving sensor status.
 * @param {import('aws-lambda').APIGatewayEvent} event The event object.
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
export const handler = async (event) => {
  const collection = hsDao.sensor_telemetry;

  const data = await collection.get({ query: { sensorId: "main_food" } });

  if (!data) return { statusCode: 404, body: "Sensor not initialized" };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      alert: data.is_empty,
      current_level: `${data.distance_cm} cm`,
      last_sync: data.timestamp,
      ui_color: data.is_empty ? "RED" : "GREEN"
    })
  };
};
