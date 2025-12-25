import hsDao from "psf-core-node/daos/hs.dao.js";
import { triggerHomeScriptEvent } from "../services/google-home.service.js";

/**
 * AWS Lambda handler for ingesting telemetry data.
 * @param {import('aws-lambda').APIGatewayEvent} event The event object.
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
export const handler = async (event) => {
  const collection = hsDao.sensor_telemetry;
  const services = hsDao.services;

  try {
    const { distance } = JSON.parse(event.body);
    
    // Fetch configuration for food sensor
    const serviceConfig = await services.get({ query: { name: "food_sensor" } });
    const alertDistance = serviceConfig?.settings?.ALERT_DISTANCE ?? 170;
    const isEmpty = distance >= alertDistance;

    // Persistencia del estado actual (Single Point of Truth)
    // We use setNew to create a new record for each telemetry event, relying on automatic createdAt
    await collection.setNew({
      data: {
          sensorId: "main_food",
          distanceCm: distance, 
          isEmpty: isEmpty
      }
    });

    // Trigger Google Home Scripting if critical level is reached
    if (isEmpty) {
        // We fire and forget to not block the response to the sensor
        triggerHomeScriptEvent('food_level_critical', { 
            sensorId: "main_food", 
            currentLevel: distance,
            threshold: alertDistance
        }).catch(err => console.error("Failed to trigger home automation:", err));
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ status: "success", received: distance }) 
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 400, body: "Error processing JSON" };
  }
};
