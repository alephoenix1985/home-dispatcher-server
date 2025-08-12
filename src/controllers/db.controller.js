// src/controllers/database.controller.js
import mongoose from 'mongoose';
import {config} from '../config/index.js';
import {logSection} from "psf-core/services/logger.service.js";

const logger = logSection('DB');
/**
 * @fileoverview Database initialization controller.
 * Handles the connection to the MongoDB database using Mongoose.
 */

/**
 * @async
 * @function connectDB
 * @description Establishes a connection to the MongoDB database using the URI from environment variables.
 * It will log a success message on connection or log a critical error and exit the process on failure.
 */
export const connectDB = async () => {
    // const clientOptions = {serverApi: {version: '1', strict: true, deprecationErrors: true}};

    try {
        await mongoose.connect(config.mongoURI, {});
        logger.info('MongoDB Connected successfully.');
    } catch (error) {
        logger.error(`MongoDB Connection Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};