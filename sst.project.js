/**
 * PSF Project-specific SST configuration.
 * This file is imported by the universal sst.config.ts.
 */
export const config = {
    appName: 'db',
    stage: 'prod',
    aws: {
        profile: 'ale02',
        region: 'us-east-1'
    },
    node: {
        routes:{
            post: ["request"]
        },
        variables: [
            "MONGO_URI",
            "AMAZON_SERVICE_SQS_DB_REQUESTS_QUEUE"
        ],
    },
};
