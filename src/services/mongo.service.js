import {logSection} from 'psf-core/node/services/logger.service.js';
import {MongoClient, ObjectId} from 'mongodb';
import { getSecretValue } from 'psf-core/shared/helpers/sst.helper.js';

const logger = logSection('MONGO-SERVICE');

/**
 * Manages MongoDB connections and operations.
 * @class
 */
class MongoService {
    /**
     * Initializes the service.
     */
    constructor() {
        this.connections = {};
        this.mongoUri = null;
    }

    /**
     * Retrieves the MongoDB connection URI from the central secret management function.
     * Caches the URI after the first retrieval.
     * @returns {Promise<string>} The MongoDB connection URI.
     */
    async getMongoUri() {
        if (!this.mongoUri) {
            // Use the centralized function to get the secret value
            this.mongoUri = getSecretValue('MONGO_URI');

            // Debugging logs
            console.log("DEBUG: Attempting to get MONGO_URI from centralized getSecretValue.");
            console.log(`DEBUG: MONGO_URI value (first 5 chars): ${this.mongoUri ? this.mongoUri.substring(0, 5) + '...' : 'undefined'}`);

            if (!this.mongoUri) {
                throw new Error('MONGO_URI secret not found via centralized getSecretValue.');
            }
        }
        return this.mongoUri;
    }

    /**
     * Establishes and retrieves a MongoDB connection for a specific database.
     * @param {string} dbName - The name of the database.
     * @returns {Promise<Db>} The MongoDB database instance.
     */
    async getConnection(dbName) {
        if (this.connections[dbName]) {
            return this.connections[dbName];
        }

        const uri = await this.getMongoUri();
        const client = new MongoClient(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        });

        try {
            await client.connect();
            this.connections[dbName] = client.db(dbName);
            logger.info(`Successfully connected to MongoDB database: ${dbName}`);
            return this.connections[dbName];
        } catch (error) {
            logger.error(`Failed to connect to MongoDB database: ${dbName}`, {error});
            throw error;
        }
    }

    /**
     * Executes a database query.
     * @param {string} dbName - The database name.
     * @param {string} collectionName - The collection name.
     * @param {string} method - The MongoDB method to execute.
     * @param {Array} args - The arguments for the method.
     * @returns {Promise<any>} The result of the query.
     */
    async execute(dbName, collectionName, method, args) {
        const db = await this.getConnection(dbName);
        return db.collection(collectionName)[method](...args);
    }

    // CRUD methods
    get = (dbName, collection, query, options) => this.execute(dbName, collection, 'findOne', [query, options]);
    getAll = (dbName, collection, query, options) => this.execute(dbName, collection, 'find', [query, options]).then(cursor => cursor.toArray());
    set = (dbName, collection, query, data, options) => this.execute(dbName, collection, 'updateOne', [query, {$set: data}, options]);
    setNew = (dbName, collection, data, options) => this.execute(dbName, collection, 'insertOne', [data, options]);
    del = (dbName, collection, query, options) => this.execute(dbName, collection, 'deleteOne', [query, options]);
    bulk = (dbName, collection, operations, options) => this.execute(dbName, collection, 'bulkWrite', [operations, options]);
    aggregate = (dbName, collection, stages, options) => this.execute(dbName, collection, 'aggregate', [stages, options]).then(cursor => cursor.toArray());

    /**
     * Executes a series of operations within a transaction.
     * @param {string} dbName - The database name.
     * @param {Function} operations - A function that receives a session and executes operations.
     * @returns {Promise<any>} The result of the transaction.
     */
    async transaction(dbName, operations) {
        const uri = await this.getMongoUri();
        const client = new MongoClient(uri);
        await client.connect();
        const session = client.startSession();
        let result;
        try {
            await session.withTransaction(async () => {
                result = await operations(session);
            });
        } finally {
            await session.endSession();
            await client.close();
        }
        return result;
    }
}

export const db = new MongoService();
export {ObjectId};
