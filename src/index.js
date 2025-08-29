import {logSection} from "core/services/logger.service.cjs";
import {startSqsListener} from "psf-core/services/aws/aws-sqs.service.js";
import {coreEnv} from "psf-core/config/core-env.config.js";
import {processResultMessage} from "./helpers/request.helper.js";
import {envConfig} from "./config/env.config.js";

const logger = logSection('MAIN');
/**
 * @fileoverview Main entry point for the application.
 * It initializes the database connection and starts the SQS listener.
 */

const main = async () => {
    logger.info(`Application starting in ${envConfig.app.nodeEnv} mode...`);
    logger.info(`Debug mode is ${envConfig.app.debugMode ? 'ON' : 'OFF'}.`);
    // 2. Start listening for SQS messages
    startSqsListener(coreEnv.aws.sqs.queueName.dbRequest, processResultMessage)
};

main().catch(error => {
    logger.error('Unhandled error in main application scope:', error);
    process.exit(1);
});