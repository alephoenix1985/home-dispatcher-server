/**
 * @file Global Migration Runner
 * Orchestrates the execution of multiple migration scripts to setup a fresh server.
 */

import { logSection } from "psf-core-node/services/logger-node.service.js";
import * as initService from "./init-service.js";

const logger = logSection('GLOBAL-MIGRATIONS');

export async function run() {
    logger.info("Starting global migration sequence...");

    try {
        // Execute individual migrations
        await initService.run();
        
        // Add more migrations here as needed
        // await otherMigration.run();

        logger.info("All global migrations completed successfully.");
    } catch (error) {
        logger.error("Global migration sequence failed:", error);
        throw error;
    }
}
