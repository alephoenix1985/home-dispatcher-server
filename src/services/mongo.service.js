import {logSection} from 'psf-core-node/services/logger.service.js';
import {MongoClient, ObjectId} from 'mongodb';
import {getSecretValue} from "psf-core-shared/helpers/env.helper.js";

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

    /**
     * Retrieves multiple documents from a collection.
     * Supports pagination if `paginate: true` is passed in options.
     * @param {string} dbName - The database name.
     * @param {string} collection - The collection name.
     * @param {object} query - The query filter.
     * @param {object} [options] - The options for the query.
     * @param {boolean} [options.paginate=false] - Whether to paginate the results.
     * @param {number} [options.page=1] - The page number to retrieve.
     * @param {number} [options.limit=10] - The number of items per page.
     * @param {number} [options.skip] - The number of documents to skip. Overrides page/limit calculation.
     * @param {object} [options.sort] - The sort order.
     * @param {object} [options.projection] - The fields to include or exclude.
     * @param {Array} [options.stages] - Additional aggregation stages to apply before pagination (only when paginate is true).
     * @returns {Promise<Array|object>} A promise that resolves to an array of documents, or a pagination object if pagination is enabled.
     */
    async getAll(dbName, collection, query, options) {
        if (!options || !options.paginate) {
            const cursor = await this.execute(dbName, collection, 'find', [query, options]);
            return cursor.toArray();
        }

        const page = Number(options.page) || 1;
        const limit = Number(options.limit) || 10;
        const skip = options.skip !== undefined ? Number(options.skip) : (page - 1) * limit;
        const sort = options.sort || {};

        const aggregateOptions = {...options};
        delete aggregateOptions.paginate;
        delete aggregateOptions.page;
        delete aggregateOptions.limit;
        delete aggregateOptions.skip;
        delete aggregateOptions.sort;
        delete aggregateOptions.projection;
        delete aggregateOptions.stages;

        const pipeline = [
            {$match: query},
        ];

        if (options.stages && Array.isArray(options.stages)) {
            pipeline.push(...options.stages);
        }

        if (options.projection) {
            pipeline.push({$project: options.projection});
        }

        const facetItems = [];
        if (Object.keys(sort).length > 0) {
            facetItems.push({$sort: sort});
        }
        facetItems.push({$skip: skip});
        facetItems.push({$limit: limit});

        pipeline.push({
            $facet: {
                items: facetItems,
                total: [{$count: 'count'}]
            }
        });

        const cursor = await this.execute(dbName, collection, 'aggregate', [pipeline, aggregateOptions]);
        const result = await cursor.toArray();

        const items = result[0] ? result[0].items : [];
        const total = result[0] && result[0].total[0] ? result[0].total[0].count : 0;

        return {
            items,
            total,
            page,
            limit
        };
    }

    set = (dbName, collection, query, data, options) => this.execute(dbName, collection, 'updateOne', [query, {$set: data}, options]);
    setNew = (dbName, collection, data, options) => this.execute(dbName, collection, 'insertOne', [data, options]);
    del = (dbName, collection, query, options) => this.execute(dbName, collection, 'deleteOne', [query, options]);
    bulk = (dbName, collection, operations, options) => this.execute(dbName, collection, 'bulkWrite', [operations, options]);
    aggregate = (dbName, collection, stages, options) => this.execute(dbName, collection, 'aggregate', [stages, options]).then(cursor => cursor.toArray());
    createIndex = (dbName, collection, indexSpec, options) => this.execute(dbName, collection, 'createIndex', [indexSpec, options]);

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

    // --- MIGRATION SYSTEM ---

    /**
     * Retrieves all migrations from the _migrations collection.
     * @param {string} dbName
     * @returns {Promise<Array>}
     */
    async getMigrations(dbName) {
        return this.getAll(dbName, '_migrations', {}, {sort: {createdAt: 1}});
    }

    /**
     * Adds a new migration definition to the database.
     * @param {string} dbName
     * @param {string} name - Unique name for the migration.
     * @param {string} upScript - The JS code string to execute for 'up'.
     * @param {string} downScript - The JS code string to execute for 'down'.
     */
    async addMigration(dbName, name, upScript, downScript) {
        const exists = await this.get(dbName, '_migrations', {name});
        if (exists) {
            throw new Error(`Migration '${name}' already exists.`);
        }
        const now = new Date();
        return this.setNew(dbName, '_migrations', {
            name,
            up: upScript,
            down: downScript,
            status: 'pending',
            createdAt: now,
            modifiedAt: now
        });
    }

    /**
     * Executes a stored migration.
     * @param {string} dbName
     * @param {string} name - The migration name.
     * @param {'up'|'down'} direction - Direction to run.
     */
    async runMigration(dbName, name, direction) {
        const migration = await this.get(dbName, '_migrations', {name});
        if (!migration) throw new Error(`Migration '${name}' not found.`);

        if (direction === 'up' && migration.status === 'applied') {
            throw new Error(`Migration '${name}' is already applied.`);
        }
        if (direction === 'down' && migration.status !== 'applied') {
            throw new Error(`Migration '${name}' is not applied, cannot rollback.`);
        }

        const script = direction === 'up' ? migration.up : migration.down;
        if (!script) throw new Error(`No script found for direction '${direction}' in migration '${name}'.`);

        const dbInstance = await this.getConnection(dbName);

        // DANGER: Executing stored code. Ensure this endpoint is secured.
        // The script is expected to be an async function body or an arrow function that takes (db, ObjectId).
        // Example: "async (db, ObjectId) => { await db.collection('users').createIndex({...}); }"
        try {
            // We wrap the script to ensure it's executable
            const executor = new Function('return ' + script)();
            await executor(dbInstance, ObjectId);

            const update = {
                status: direction === 'up' ? 'applied' : 'rolled_back',
                modifiedAt: new Date()
            };
            await this.set(dbName, '_migrations', {name}, update);
            return {success: true, message: `Migration ${name} (${direction}) executed successfully.`};
        } catch (error) {
            logger.error(`Migration execution failed: ${name} (${direction})`, {error});
            throw error;
        }
    }

    /**
     * Creates a snapshot migration of the current database structure (collections & indexes).
     * @param {string} dbName
     * @param {string} [snapshotName] - Optional custom name.
     */
    async createSnapshot(dbName, snapshotName) {
        const dbInstance = await this.getConnection(dbName);
        const collections = await dbInstance.listCollections().toArray();
        const name = snapshotName || `snapshot_${new Date().toISOString().replace(/[-:.]/g, '')}`;

        let upScriptLines = [];
        let downScriptLines = [];

        upScriptLines.push(`// Snapshot: ${name}`);
        upScriptLines.push(`async (db) => {`);

        downScriptLines.push(`// Revert Snapshot: ${name}`);
        downScriptLines.push(`async (db) => {`);

        for (const col of collections) {
            if (col.name === '_migrations' || col.name.startsWith('system.')) continue;

            // 1. Create Collection (preserves options like validation)
            // We need to sanitize options to avoid issues with undefined/nulls in stringify
            const options = JSON.stringify(col.options || {});
            upScriptLines.push(`  try { await db.createCollection('${col.name}', ${options}); } catch(e) { console.log('Collection ${col.name} might exist'); }`);
            downScriptLines.push(`  await db.collection('${col.name}').drop().catch(e => console.log('Collection ${col.name} not found to drop'));`);

            // 2. Create Indexes
            const indexes = await dbInstance.collection(col.name).indexes();
            for (const idx of indexes) {
                if (idx.name === '_id_') continue; // Skip default _id index
                const key = JSON.stringify(idx.key);
                const idxOptions = {...idx};
                delete idxOptions.key;
                delete idxOptions.v; // Remove version field
                delete idxOptions.ns; // Remove namespace field
                const idxOptsStr = JSON.stringify(idxOptions);

                upScriptLines.push(`  await db.collection('${col.name}').createIndex(${key}, ${idxOptsStr});`);
            }
        }

        upScriptLines.push(`}`);
        downScriptLines.push(`}`);

        const upScript = upScriptLines.join('\n');
        const downScript = downScriptLines.join('\n');

        return this.addMigration(dbName, name, upScript, downScript);
    }
}

export const db = new MongoService();
export {ObjectId};
