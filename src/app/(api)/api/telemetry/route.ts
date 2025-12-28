import { NextResponse } from 'next/server';
import hsDao from "psf-core-node/daos/hs.dao.js";
import { triggerHomeScriptEvent } from "@/services/google-home.service.js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { distance, serviceId } = body;
    const targetServiceKey = serviceId || "main_food";

    const collection = hsDao.sensor_telemetry;
    const services = hsDao.services;

    // Fetch configuration for the sensor service using 'key'
    const serviceConfig = await services.getServiceByKey(targetServiceKey);

    // Use ALERT_LOW_LEVEL from settings (matching device code) or default to 170
    const alertDistance = serviceConfig?.settings?.ALERT_LOW_LEVEL ?? 170;

    const isEmpty = distance >= alertDistance;

    // Persistencia del estado actual (Single Point of Truth)
    await collection.saveTelemetry({
          sensorId: targetServiceKey,
          distanceCm: distance,
          isEmpty: isEmpty
    });

    // Trigger Google Home Scripting if critical level is reached
    if (isEmpty) {
        triggerHomeScriptEvent('food_level_critical', {
            sensorId: targetServiceKey,
            currentLevel: distance,
            threshold: alertDistance
        }).catch(err => console.error("Failed to trigger home automation:", err));
    }

    return NextResponse.json({ status: "success", received: distance });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error processing JSON" }, { status: 400 });
  }
}
