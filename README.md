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
AMAZON_SERVICE_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
AMAZON_SERVICE_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
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

*   `deploy:prod` or `deploy:dev`
    *   **Action**: Deploys the service to AWS using the Serverless Framework.
    *   **Usage**: Use this command to deploy or update the Lambda function and its resources.

## Deployment and Update Flow

The project is now deployed using the Serverless Framework, which simplifies the CI/CD process.

### Deployment
1.  Install the Serverless Framework globally: `npm install -g serverless`.
2.  Configure your AWS credentials.
3.  Run `npm run deploy:prod` or `npm run deploy:dev` to deploy the stack to your AWS account.

### Automated CI/CD Flow with GitHub Actions and Watchtower

The CI/CD workflow should be updated to use Serverless Framework commands.

1.  **GitHub Actions Trigger**: A GitHub Actions workflow is configured to monitor the `main` (for production) and `dev` (for development) branches. When code is pushed to either of these branches, the workflow is triggered.

2.  **Serverless Deploy**: The workflow runs `sls deploy --stage <stage>` to automatically package the code, create/update the Lambda function, and configure the SQS trigger in AWS.

This process ensures that any update pushed to the `main` or `dev` branch is automatically deployed to the corresponding AWS environment. The Watchtower and Docker-based deployment for this service are no longer needed.

## Listing API Gateway Endpoints and Lambda Functions

Para ver los endpoints de API Gateway desplegados y sus funciones Lambda asociadas para un servicio, usa el script `list:api:functions` definido en `package.json`. Este script es genérico y funciona para cualquier proyecto que siga la convención de nombres de SST (nombre del servicio en `package.json` + `-api`).

### Uso

```bash
npm run list:api:functions [-- --stage <dev|prod>] [-- --profile <aws_profile>] [-- --region <aws_region>]
```

*   `--stage`: Especifica el entorno de despliegue (`dev` o `prod`). Si no se especifica, se verificarán ambos.
*   `--profile`: Especifica el perfil de AWS a usar de tu archivo `~/.aws/credentials`. Por defecto es `ale02`.
*   `--region`: Especifica la región de AWS a usar. Por defecto es `us-east-1`.

**Nota:** Los argumentos para el script bash deben ir después de `--` cuando se ejecuta a través de `npm run`.

### Ejemplos

*   Listar funciones y endpoints para los entornos `dev` y `prod` (por defecto) usando el perfil de AWS `ale02` y la región `us-east-1`:
    ```bash
    npm run list:api:functions
    ```

*   Listar funciones y endpoints solo para el entorno `prod` usando el perfil de AWS `ale02` y la región `us-east-1`:
    ```bash
    npm run list:api:functions -- --stage prod
    ```

*   Listar funciones y endpoints para los entornos `dev` y `prod` usando un perfil de AWS diferente llamado `my-profile` y la región por defecto:
    ```bash
    npm run list:api:functions -- --profile my-profile
    ```

## Actualización de URLs de Servicio en SSM

Para consultar la URL base de un API Gateway desplegado y actualizar un parámetro de AWS SSM con esa URL, usa el script `update:service:url` definido en `package.json`. Este script es útil para mantener actualizadas las URLs de tus servicios en SSM, que pueden ser consumidas por otras aplicaciones.

### Uso

```bash
npm run update:service:url [-- --var <SSM_VAR_PREFIX>] [-- --stage <dev|prod>] [-- --profile <aws_profile>] [-- --region <aws_region>]
```

*   `--var`: **(Requerido)** Especifica el prefijo para el nombre del parámetro SSM (ej., `DB_SERVICE`). El nombre final del parámetro en SSM será `[SSM_VAR_PREFIX]_[STAGE_EN_MAYUSCULAS]` (ej., `DB_SERVICE_PROD`).
*   `--stage`: Especifica el entorno de despliegue (`dev` o `prod`). Si no se especifica, se actualizarán ambos.
*   `--profile`: Especifica el perfil de AWS a usar de tu archivo `~/.aws/credentials`. Por defecto es `ale02`.
*   `--region`: Especifica la región de AWS a usar. Por defecto es `us-east-1`.

**Nota:** Los argumentos para el script bash deben ir después de `--` cuando se ejecuta a través de `npm run`.

### Ejemplos

*   Actualizar la URL del servicio `DB_SERVICE` para el entorno `prod` en la región `us-east-1` usando el perfil `ale02`:
    ```bash
    npm run update:service:url -- --var DB_SERVICE --stage prod
    ```

*   Actualizar la URL del servicio `AUTH_SERVICE` para el entorno `dev` en la región `us-east-1` usando un perfil diferente llamado `my-profile`:
    ```bash
    npm run update:service:url -- --var AUTH_SERVICE --stage dev --profile my-profile
    ```

Este script buscará el API Gateway correspondiente a tu proyecto y stage, extraerá su URL base y la guardará en el parámetro SSM especificado.
