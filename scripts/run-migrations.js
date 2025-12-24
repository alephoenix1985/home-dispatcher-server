/**
 * @file Migration Runner Script
 * Executes database migrations or seeds initial data.
 */

import hsDao from "psf-core-node/daos/hs.dao.js";
import { logSection } from "psf-core-node/services/logger-node.service.js";

const logger = logSection('RUN-MIGRATIONS');

async function seedServices() {
    logger.info("Seeding services...");
    
    const foodSensorService = {
        name: "food_sensor",
        settings: {
            ALERT_DISTANCE: 170
        }
    };

    await hsDao.services.upsert({
        query: { name: "food_sensor" },
        update: { $set: foodSensorService }
    });

    logger.info("Services seeded successfully.");
}

async function main() {
    try {
        await seedServices();
        logger.info("Migration/Seed completed successfully.");
    } catch (error) {
        logger.error("Migration/Seed failed:", error);
        process.exit(1);
    }
}

main();
