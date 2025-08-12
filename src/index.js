// index.js
import {connectDB} from './controllers/db.controller.js';
import {startListening} from './listeners/sqs.listener.js';
import {config} from './config/index.js';
import {logSection} from "core/services/logger.service.js";
import {ensureAtlasSearchIndexes} from "./helpers/migration.helper.js";

const logger = logSection('MAIN');
/**
 * @fileoverview Main entry point for the application.
 * It initializes the database connection and starts the SQS listener.
 */

const main = async () => {
    logger.info(`Application starting in ${config.nodeEnv} mode...`);
    logger.info(`Debug mode is ${config.debugMode ? 'ON' : 'OFF'}.`);

    // 1. Establish database connection
    await connectDB();

    // ✅ 2. Ensure all Atlas Search indexes are created as defined
    await ensureAtlasSearchIndexes();
    // 2. Start listening for SQS messages
    startListening();
};

main().catch(error => {
    logger.error('Unhandled error in main application scope:', error);
    process.exit(1);
});