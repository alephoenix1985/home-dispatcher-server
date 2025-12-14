import { ObjectId } from 'mongodb';
import { db } from '../services/mongo.service.js';
import { logSection } from 'psf-core-node/services/logger.service.js';

const logger = logSection('DATA-CONTROLLER');

const handleRequest = async (handler, req, res) => {
    try {
        const result = await handler(req.body);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        logger.error(`Error processing request: ${error.message}`, { error });
        res.status(500).json({ success: false, error: error.message });
    }
};

const validationErrorMessage = "Request payload must include both 'dbName' and 'collection' properties.";
const dbNameValidationErrorMessage = "Request payload must include 'dbName' property.";

const get = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, query, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.get(dbName, collection, query, options);
}, req, res);

const getAll = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, query, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.getAll(dbName, collection, query, options);
}, req, res);

const getById = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, id, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    if (!id) throw new Error("'id' property is missing in the payload for getById.");
    const query = { _id: new ObjectId(id) };
    return await db.get(dbName, collection, query, options);
}, req, res);


const set = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, query, data, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.set(dbName, collection, query, data, options);
}, req, res);

const upsert = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, query, data, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.set(dbName, collection, query, data, { ...options, upsert: true, returnDocument: 'after' });
}, req, res);

const setNew = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, data, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.setNew(dbName, collection, data, options);
}, req, res);

const del = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, query, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.del(dbName, collection, query, options);
}, req, res);

const delById = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, id, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    if (!id) throw new Error("'id' property is missing in the payload for delById.");
    const query = { _id: new ObjectId(id) };
    return await db.del(dbName, collection, query, options);
}, req, res);

const bulk = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, operations, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.bulk(dbName, collection, operations, options);
}, req, res);

const aggregate = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, stages, options } = payload;
    if (!dbName || !collection) throw new Error(validationErrorMessage);
    return await db.aggregate(dbName, collection, stages, options);
}, req, res);

const transaction = (req, res) => handleRequest(async (payload) => {
    const { dbName, operations } = payload;
    if (!dbName) throw new Error(dbNameValidationErrorMessage);
    if (!Array.isArray(operations) || operations.length === 0) {
        throw new Error('The "operations" parameter must be a non-empty array.');
    }
    return await db.transaction(dbName, operations);
}, req, res);

const createIndex = (req, res) => handleRequest(async (payload) => {
    const { dbName, collection, indexSpec, options } = payload;
    if (!dbName || !collection || !indexSpec) throw new Error("Payload must include 'dbName', 'collection', and 'indexSpec'.");
    return await db.createIndex(dbName, collection, indexSpec, options);
}, req, res);

// --- MIGRATION CONTROLLERS ---

const getMigrations = (req, res) => handleRequest(async (payload) => {
    const { dbName } = payload;
    if (!dbName) throw new Error(dbNameValidationErrorMessage);
    return await db.getMigrations(dbName);
}, req, res);

const addMigration = (req, res) => handleRequest(async (payload) => {
    const { dbName, name, upScript, downScript } = payload;
    if (!dbName || !name || !upScript || !downScript) throw new Error("Payload must include 'dbName', 'name', 'upScript', and 'downScript'.");
    return await db.addMigration(dbName, name, upScript, downScript);
}, req, res);

const runMigration = (req, res) => handleRequest(async (payload) => {
    const { dbName, name, direction } = payload;
    if (!dbName || !name || !direction) throw new Error("Payload must include 'dbName', 'name', and 'direction'.");
    return await db.runMigration(dbName, name, direction);
}, req, res);

const createSnapshot = (req, res) => handleRequest(async (payload) => {
    const { dbName, snapshotName } = payload;
    if (!dbName) throw new Error(dbNameValidationErrorMessage);
    return await db.createSnapshot(dbName, snapshotName);
}, req, res);


export const dataController = {
    // Standard CRUD
    get,
    getAll,
    getById,
    set,
    setNew,
    upsert,
    del,
    delById,
    // Advanced Operations
    aggregate,
    bulk,
    transaction,
    createIndex,
    // Migration System
    addMigration,
    getMigrations,
    runMigration,
    createSnapshot,
};
