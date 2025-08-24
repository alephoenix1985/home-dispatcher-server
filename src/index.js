// index.js
import {startListening} from './listeners/sqs.listener.js';
import {config} from './config/index.js';
import {logSection} from "psf-core/services/logger.service.js";

const logger = logSection('MAIN');
/**
 * @fileoverview Main entry point for the application.
 * It initializes the database connection and starts the SQS listener.
 */

const main = async () => {
    logger.info(`Application starting in ${config.nodeEnv} mode...`);
    logger.info(`Debug mode is ${config.debugMode ? 'ON' : 'OFF'}.`);

    // 2. Start listening for SQS messages
    startListening();
};

main().catch(error => {
    logger.error('Unhandled error in main application scope:', error);
    process.exit(1);
});