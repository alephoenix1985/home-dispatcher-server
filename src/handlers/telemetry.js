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
    const { distance, serviceId } = JSON.parse(event.body);
    const targetServiceKey = serviceId || "main_food";
    
    // Fetch configuration for the sensor service using 'key'
    const serviceConfig = await services.get({ query: { key: targetServiceKey } });
    
    // Use ALERT_LOW_LEVEL from settings (matching device code) or default to 170
    const alertDistance = serviceConfig?.settings?.ALERT_LOW_LEVEL ?? 170;
    
    const isEmpty = distance >= alertDistance;

    // Persistencia del estado actual (Single Point of Truth)
    // We store 'sensorId' in telemetry to link back to the service 'key'
    await collection.setNew({
      data: {
          sensorId: targetServiceKey,
          distanceCm: distance, 
          isEmpty: isEmpty
      }
    });

    // Trigger Google Home Scripting if critical level is reached
    if (isEmpty) {
        triggerHomeScriptEvent('food_level_critical', { 
            sensorId: targetServiceKey,
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
