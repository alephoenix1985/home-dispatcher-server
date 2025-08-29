import {MongoClient, ObjectId} from 'mongodb';
import {logSection} from 'core/services/logger.service.cjs';
import {envConfig} from "../config/env.config.js";

const logger = logSection('MONGO');

let client;

const convertStringsToObjectId = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => convertStringsToObjectId(item));
    }
    if (data !== null && typeof data === 'object' && !(data instanceof Date) && !(data instanceof ObjectId)) {
        const newObj = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newObj[key] = convertStringsToObjectId(data[key]);
            }
        }
        return newObj;
    }
    if (typeof data === 'string' && ObjectId.isValid(data) && data.length === 24) {
        return new ObjectId(data);
    }
    return data;
};

const getClient = async () => {
    if (client && client.topology && client.topology.isConnected()) {
        logger.debug('Reusing existing MongoDB client connection.');
        return client;
    }
    try {
        logger.info('No active MongoDB connection found. Creating a new one...');
        client = new MongoClient(envConfig.db.mongo.uri, envConfig.db.mongo.options);
        await client.connect();
        logger.info('Successfully connected to MongoDB.');
        return client;
    } catch (error) {
        logger.error('Failed to connect to MongoDB.', {error});
        client = undefined;
        throw error;
    }
};

const get = async (dbName, collectionName, query = {}, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedQuery = convertStringsToObjectId(query);
    logger.debug(`Executing GET on ${dbName}.${collectionName}`, {query: cleanedQuery});
    return await collection.findOne(cleanedQuery, options);
};

const getAll = async (dbName, collectionName, query = {}, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedQuery = convertStringsToObjectId(query);
    logger.debug(`Executing GET_ALL on ${dbName}.${collectionName}`, {query: cleanedQuery});
    return await collection.find(cleanedQuery, options).toArray();
};

const set = async (dbName, collectionName, query, data, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedQuery = convertStringsToObjectId(query);
    const cleanedData = convertStringsToObjectId(data);
    logger.debug(`Executing SET on ${dbName}.${collectionName}`, {query: cleanedQuery});
    const updateOptions = {...options};
    return await collection.updateOne(cleanedQuery, {$set: cleanedData}, updateOptions);
};

const setNew = async (dbName, collectionName, data, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedData = convertStringsToObjectId(data);
    logger.debug(`Executing SET_NEW on ${dbName}.${collectionName}`);
    const updateOptions = {...options};
    const doc = await collection.insertOne(cleanedData, updateOptions);
    return {...cleanedData, _id: doc.insertedId};
};

const del = async (dbName, collectionName, query, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedQuery = convertStringsToObjectId(query);
    logger.debug(`Executing DELETE on ${dbName}.${collectionName}`, {query: cleanedQuery});
    return await collection.deleteMany(cleanedQuery, options);
};

const bulk = async (dbName, collectionName, operations, options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedOperations = convertStringsToObjectId(operations);
    logger.debug(`Executing BULK on ${dbName}.${collectionName}`, {operationCount: cleanedOperations.length});
    return await collection.bulkWrite(cleanedOperations, options);
};

const aggregate = async (dbName, collectionName, stages = [], options = {}) => {
    const client = await getClient();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const cleanedStages = convertStringsToObjectId(stages);
    logger.debug(`Executing AGGREGATE on ${dbName}.${collectionName}`, {stageCount: cleanedStages.length});
    return await collection.aggregate(cleanedStages, options).toArray();
};

const getValueFromPath = (obj, path) => {
    if (!path || typeof path !== 'string') return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const resolvePlaceholders = (current, prevResult) => {
    if (!prevResult) return current;

    if (Array.isArray(current)) {
        return current.map(item => resolvePlaceholders(item, prevResult));
    }

    if (current !== null && typeof current === 'object' && !(current instanceof Date) && !(current instanceof ObjectId)) {
        const newObj = {};
        for (const key in current) {
            if (Object.prototype.hasOwnProperty.call(current, key)) {
                newObj[key] = resolvePlaceholders(current[key], prevResult);
            }
        }
        return newObj;
    }

    if (typeof current === 'string' && current.startsWith('$$prev.')) {
        const path = current.substring(7);
        const resolvedValue = getValueFromPath(prevResult, path);
        logger.debug(`Resolved placeholder '${current}' to value:`, {resolvedValue});
        if (resolvedValue === undefined) {
            throw new Error(`Placeholder '${current}' could not be resolved from previous operation\'s result.`);
        }
        return resolvedValue;
    }

    return current;
};

const transaction = async (dbName, operations) => {
    const client = await getClient();
    const session = client.startSession();
    logger.info(`Starting transaction on database: ${dbName}`);

    try {
        const results = [];
        await session.withTransaction(async () => {
            for (const op of operations) {
                const previousResult = results.length > 0 ? results[results.length - 1] : null;
                const resolvedOp = resolvePlaceholders(op, previousResult);
                const {method, collection, query, data, stages, id, bulkOps} = resolvedOp;

                const options = {session};
                let result;

                logger.debug(`Executing operation '${method}' on collection '${collection}' within transaction.`);

                switch (method) {
                    case 'get':
                        result = await get(dbName, collection, query, options);
                        break;
                    case 'getAll':
                        result = await getAll(dbName, collection, query, options);
                        break;
                    case 'getById':
                        result = await get(dbName, collection, {_id: id}, options);
                        break;
                    case 'set':
                        result = await set(dbName, collection, query, data, options);
                        if (result.upsertedId) {
                            result._id = result.upsertedId;
                        }
                        break;
                    case 'setNew':
                        result = await setNew(dbName, collection, query, data, options);
                        break;
                    case 'setById':
                        result = await set(dbName, collection, query, {_id: id}, options);
                        if (result.upsertedId) {
                            result._id = result.upsertedId;
                        }
                        break;
                    case 'del':
                        result = await del(dbName, collection, query, options);
                        break;
                    case 'delById':
                        result = await del(dbName, collection, {_id: id}, options);
                        break;
                    case 'bulk':
                        result = await bulk(dbName, collection, bulkOps, options);
                        break;
                    case 'aggregate':
                        result = await aggregate(dbName, collection, stages, options);
                        break;
                    default:
                        throw new Error(`Unsupported method '${method}' in transaction.`);
                }
                results.push(result);
            }
        });

        logger.info(`Transaction committed successfully on database: ${dbName}`);
        return results;
    } catch (error) {
        logger.error(`Transaction aborted due to an error on database: ${dbName}`, {error});
        throw error;
    } finally {
        session.endSession();
        logger.debug(`Transaction session ended for database: ${dbName}`);
    }
};

export const db = {
    aggregate,
    bulk,
    convertStringsToObjectId,
    del,
    get,
    getAll,
    getClient,
    set,
    setNew,
    transaction,
};
