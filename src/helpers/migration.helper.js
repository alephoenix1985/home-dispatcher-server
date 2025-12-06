import { logSection } from 'psf-core-node/services/logger.service.js';
import { db } from '../services/mongo.service.js';
import path from 'path';
import fs from 'fs';

const logger = logSection('MIGRATION-HELPER');

/**
 * Manages and executes database migrations.
 * @class
 */
class MigrationHelper {
    /**
     * Initializes the helper with the specified environment.
     * @param {string} environment - The deployment environment (e.g., 'dev', 'prod').
     */
    constructor(environment) {
        this.environment = environment;
        this.migrationsDir = path.join(process.cwd(), 'src', 'migrations');
        this.dbName = process.env.MONGO_DB_DBNAME;
    }

    /**
     * Retrieves the list of executed migration scripts from the database.
     * @returns {Promise<string[]>} A list of migration script names.
     */
    async getExecutedMigrations() {
        try {
            const migrations = await db.getAll(this.dbName, '_migrations');
            return migrations.map(m => m.script);
        } catch (error) {
            // If the collection doesn't exist, it's the first run.
            if (error.message.includes('ns not found')) {
                logger.info('_migrations collection not found. Assuming first run.');
                return [];
            }
            logger.error('Failed to get executed migrations.', { error });
            throw error;
        }
    }

    /**
     * Executes all pending migration scripts.
     */
    async run() {
        logger.info(`Starting migrations for environment: ${this.environment}`);
        
        if (!this.dbName) {
            logger.error('MONGO_DB_DBNAME is not defined in environment variables.');
            throw new Error('MONGO_DB_DBNAME is not defined.');
        }

        const executedMigrations = await this.getExecutedMigrations();
        const migrationFiles = fs.readdirSync(this.migrationsDir).filter(file => file.endsWith('.js'));

        for (const file of migrationFiles) {
            if (executedMigrations.includes(file)) {
                logger.info(`Skipping already executed migration: ${file}`);
                continue;
            }

            logger.info(`Running migration: ${file}`);
            try {
                const migration = await import(path.join(this.migrationsDir, file));
                if (typeof migration.up !== 'function') {
                    throw new Error(`Migration script ${file} must export an 'up' function.`);
                }

                await migration.up(db, this.dbName);
                await db.setNew(this.dbName, '_migrations', { script: file, executedAt: new Date() });
                logger.info(`Successfully executed migration: ${file}`);
            } catch (error) {
                logger.error(`Failed to execute migration: ${file}`, { error });
                throw error; // Stop execution on failure
            }
        }

        logger.info('All pending migrations have been executed.');
    }
}

export default MigrationHelper;
