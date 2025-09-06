# PSF Database Service

This project is a decoupled microservice designed to handle all database interactions for the platform. It operates by listening to an AWS SQS queue, processing requests, interacting with a MongoDB cluster, and caching results in Redis.

## Project Overview and Flow

The primary responsibility of this service is to act as a dedicated and isolated data layer. This decoupled architecture ensures that other services do not need direct access to the database, improving security and maintainability.

### Workflow

1.  **Listen for Events**: The service actively listens for messages on an AWS SQS queue named `results`.
2.  **Process Messages**: Each message is expected to contain a `correlationId` and a `payload`. The service uses this information to determine the required action.
3.  **Database Interaction**: Based on the message payload, the service performs the corresponding query or command on the MongoDB sharded cluster.
4.  **Cache Results**: The result of the database operation is then stored in a Redis server. The `correlationId` from the original message is used as the key for the cached result, allowing the requesting service to retrieve it efficiently.

## Infrastructure Configuration

This repository also contains the Docker Compose configurations for the required backend infrastructure, located within the `config/NAS` directory.
*   **MongoDB Cluster**: Includes the setup for a sharded MongoDB environment with multiple replica sets for both shards and config servers, simulating a production-grade deployment.
*   **Redis Server**: Includes the `redis-compose.yaml` and configuration file to run a secure Redis instance for caching.

## Project Setup

Follow these steps to set up the project locally for development.

### 1. Clone and Initialize Submodules

This project uses git submodules (like `psf-core`) to manage shared code. After cloning the repository, you must initialize and update these submodules.

```bash
git submodule update --init --recursive
```

### 2. Install Dependencies

Install the required Node.js packages using npm.

```bash
npm install
```

## Environment Configuration

The application determines its runtime environment (e.g., `production` or `development`) by parsing the command-line arguments passed to the Node.js process. A helper script (`core/helpers/process.helper.js`) checks `process.argv` for keywords like `prod` or `dev`.

Based on the detected environment, the `updateProcessEnv` function loads the corresponding environment file:

*   If `prod` is detected, it loads variables from **`.env.prod`**.
*   If `dev` is detected, it loads variables from **`.env.dev`**.

### Environment File Template (`.env.prod`)

You must create a `.env.prod` and/or `.env.dev` file in the root of the `db` directory. Use the following template, replacing the placeholder values with your actual credentials and endpoints.

```env
# MongoDB Connection
# This should point to the mongos router of your sharded cluster
MONGO_URI=mongodb://your-nas-ip:37017/

# AWS Credentials for SQS
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
AWS_REGION=us-east-1
SQS_QUEUE_URL_RESULTS=https://sqs.us-east-1.amazonaws.com/your-account-id/results

# Redis Connection for Caching
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

## `package.json` Scripts

The following scripts are essential for managing and running the application.

*   `db:seed:prod` or `db:seed:dev`
    *   **Action**: Runs database migrations and seeds initial data.
    *   **Usage**: This is a critical first step after setting up your environment. You must run this before starting the application for the first time to ensure the database schema is correct.

*   `start:prod` or `start:dev`
    *   **Action**: Starts the application in the specified environment.
    *   **Usage**: Use this command to run the service after the database has been seeded.

*   `compose:generate:prod` or `compose:generate:dev`
    *   **Action**: Generates a `docker-compose.generated.yaml` file.
    *   **Usage**: This script is part of the deployment process for creating a complete, self-contained Docker Compose file for the server.

## Deployment and Update Flow

The project is designed for a seamless CI/CD workflow that automates updates.

### Manual Deployment

For an initial server setup or manual deployment, you can generate a complete Docker Compose file.

1.  Run the script `npm run compose:generate:prod`.
2.  This will create a `docker-compose.generated.yaml` file.
3.  This generated file contains the full service definition and can be used to deploy the application on a server using `docker-compose -f docker-compose.generated.yaml up -d`.

### Automated CI/CD Flow with GitHub Actions and Watchtower

The primary update mechanism is fully automated.

1.  **GitHub Actions Trigger**: A GitHub Actions workflow is configured to monitor the `main` (for production) and `dev` (for development) branches. When code is pushed to either of these branches, the workflow is triggered.

2.  **Build and Push Image**: The workflow automatically builds a new Docker image of the application and pushes it to the GitHub Container Registry (ghcr.io) with an appropriate tag (e.g., `latest` or a version number).

3.  **Watchtower Monitoring**: On the production/development server, a **Watchtower** container is running as part of the server's Docker Compose setup. Watchtower is configured to monitor the specific application image in the ghcr.io repository.

4.  **Automatic Update**: When Watchtower detects that a new version of the image has been pushed to the registry, it automatically:
    *   Pulls the new image down to the server.
    *   Gracefully stops the currently running application container.
    *   Starts a new container using the updated image.

This process ensures that any update pushed to the `main` or `dev` branch is automatically deployed to the corresponding server without any manual intervention.