# PSF Database Service

This project is a decoupled microservice designed to handle all database interactions for the platform. It acts as a secure and centralized data layer, exposing a clear API for other services.

## Core Features

*   **Decoupled Architecture**: Other services interact with the database through a well-defined API, not directly. This improves security, maintainability, and scalability.
*   **MongoDB Integration**: Provides a robust `MongoService` class that abstracts MongoDB operations.
*   **Advanced Querying**: Supports complex queries, pagination, and full-text search with relevance scoring.
*   **Database Migrations**: Includes a powerful, built-in migration system to manage database schema changes programmatically.

---

## MongoService API

The `MongoService` is the heart of this project. It provides a set of methods to interact with the MongoDB database.

### Standard CRUD and Querying

*   `get(dbName, collection, query, options)`: Fetches a single document.
*   `getAll(dbName, collection, query, options)`: Fetches multiple documents.
*   `set(dbName, collection, query, data, options)`: Updates a document.
*   `setNew(dbName, collection, data, options)`: Inserts a new document.
*   `del(dbName, collection, query, options)`: Deletes a document.
*   `bulk(dbName, collection, operations, options)`: Performs multiple write operations.
*   `aggregate(dbName, collection, stages, options)`: Executes an aggregation pipeline.
*   `createIndex(dbName, collection, indexSpec, options)`: Creates an index on a collection.

### Advanced `getAll` with Pagination

The `getAll` method supports advanced pagination and aggregation. To enable it, pass `paginate: true` in the `options` object.

**Example: Paginated request**

```javascript
const results = await db.getAll('myDb', 'users', { status: 'active' }, {
  paginate: true,
  page: 2,
  limit: 20,
  sort: { createdAt: -1 }
});

/*
Expected result:
{
  "items": [ ... ], // 20 records from page 2
  "total": 150,     // Total count of active users
  "page": 2,
  "limit": 20
}
*/
```

### Full-Text Search with Relevance Scoring

To perform a "Google-like" search, you must first create a **text index**. The recommended approach is a wildcard index, which automatically includes all string fields.

**Step 1: Create the Text Index (Run once)**

Use the migration system (see below) or run directly:

```javascript
// Creates a text index on all string fields of the 'users' collection
await db.createIndex('myDb', 'users', { "$**": "text" });
```

**Step 2: Perform the Search**

Use the `$text` operator in your query and project the `$meta: "textScore"` to get the relevance score.

```javascript
const results = await db.getAll('myDb', 'users',
  { $text: { $search: "john doe" } }, // The search query
  {
    paginate: true,
    projection: {
      score: { $meta: "textScore" } // Project the relevance score
    },
    sort: {
      score: { $meta: "textScore" } // Sort by relevance
    }
  }
);
```

---

## Database Migration System

This service includes a powerful migration system that allows you to manage and version your database schema directly from your code. Migrations are stored in a `_migrations` collection in your database.

### Core Concepts

*   **Up & Down Scripts**: Each migration consists of an `up` script (to apply the change) and a `down` script (to revert it).
*   **Code as Data**: The migration scripts are stored as JavaScript code strings in the database, making the system self-contained and portable.
*   **Snapshots**: You can generate a "snapshot" migration that captures the entire structure (collections and indexes) of your database at a specific point in time.

### Migration API Methods

*   `addMigration(dbName, name, upScript, downScript)`: Registers a new migration.
*   `getMigrations(dbName)`: Lists all migrations and their status (`pending`, `applied`, `rolled_back`).
*   `runMigration(dbName, name, direction)`: Executes a specific migration (`up` or `down`).
*   `createSnapshot(dbName, [snapshotName])`: Creates a snapshot migration of the current DB structure.

### How to Write and Run Migrations

**1. Add a New Migration**

Create a migration to add a new index. The scripts are async functions that receive the `db` instance.

```javascript
const migrationName = 'add-username-index-to-users';
const upScript = `
  async (db) => {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
  }
`;
const downScript = `
  async (db) => {
    await db.collection('users').dropIndex('username_1');
  }
`;

await db.addMigration('myDb', migrationName, upScript, downScript);
```

**2. Run the Migration**

Execute the `up` script to apply the changes.

```javascript
await db.runMigration('myDb', 'add-username-index-to-users', 'up');
// The index is now created and the migration is marked as 'applied'.
```

**3. Create a Snapshot**

After setting up your collections and indexes, create a snapshot to serve as a baseline for new environments.

```javascript
await db.createSnapshot('myDb', 'initial-schema-snapshot');
// A new migration is created containing the 'up' and 'down' scripts
// to recreate the entire database structure.
```

You can then run this snapshot migration on a new, empty database to instantly provision its structure.

---

## Project Setup & Deployment

### Environment Configuration

Create a `.env.dev` and/or `.env.prod` file in the project root.

```env
# MongoDB Connection URI
MONGO_URI=mongodb://your-nas-ip:37017/

# AWS Credentials & Region
AMAZON_SERVICE_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AMAZON_SERVICE_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1

# SQS Queue for results (if applicable)
SQS_QUEUE_URL_RESULTS=https://sqs.us-east-1.amazonaws.com/your-account-id/results

# Redis Connection (if applicable)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

### `package.json` Scripts

*   `npm run deploy:dev` / `npm run deploy:prod`
    *   Deploys the service to AWS using the Serverless Framework (SST).

*   `npm run list:api:functions -- --stage <dev|prod>`
    *   Lists all deployed API Gateway endpoints and their associated Lambda functions for the specified stage.

*   `npm run update:service:url -- --var <SSM_VAR_PREFIX> --stage <dev|prod>`
    *   Updates an AWS SSM Parameter with the service's deployed API Gateway URL. This is useful for service discovery.
    *   Example: `npm run update:service:url -- --var DB_SERVICE --stage prod` will update the `DB_SERVICE_PROD` SSM parameter.
