/**
 * @file Init Service Migration
 * Creates the initial 'main_food' service configuration.
 */

import hsDao from "psf-core-node/daos/hs.dao.js";
import { logSection } from "psf-core-node/services/logger-node.service.js";

const logger = logSection('MIGRATION:INIT-SERVICE');

export async function run() {
    logger.info("Starting migration: init-service...");
    
    const foodSensorService = {
        key: "main_food",
        name: "Comida Brownie",
        settings: {
            STEADY_MODE_INTERVAL: 360000, // 6 hours
            ALERT_LOW_LEVEL: 170,         // cm
            ALERT_MODE_INTERVAL: 60000,   // 1 minute
            REMINDER: true,
            LED_ALERT: true,
            LED_CHECK: true
        }
    };

    // Use updateServiceSettings custom method or upsert directly
    // Using upsert directly for clarity in migration
    await hsDao.services.upsert({
        query: { key: "main_food" },
        data: { $set: foodSensorService }
    });

    logger.info("Migration 'init-service' completed successfully.");
}
