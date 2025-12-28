import { NextResponse } from 'next/server';
import hsDao from "psf-core-node/daos/hs.dao.js";

export async function GET() {
  const collection = hsDao.sensor_telemetry;

  const data = await collection.getLatestBySensorId("main_food");

  if (!data) return NextResponse.json({ error: "Sensor not initialized" }, { status: 404 });

  return NextResponse.json({
    alert: data.isEmpty,
    currentLevel: `${data.distanceCm} cm`,
    lastSync: data.timestamp,
    uiColor: data.isEmpty ? "RED" : "GREEN"
  });
}
