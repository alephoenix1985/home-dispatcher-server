/**
 * PSF Project-specific SST configuration.
 * This file is imported by the universal sst.config.ts.
 */
export const config = {
    appName: 'home-server',
    stage: 'prod',
    aws: {
        profile: 'ale02',
        region: 'us-east-1'
    },
    next: {
        domain: 'p-sf.com',
        subDomain: 'home',
        variables: [
            "AMAZON_SERVICE_SQS_DB_REQUESTS_QUEUE",
            "AMAZON_SERVICE_SQS_HS_REQUESTS_QUEUE",
            "GOOGLE_HOME_SCRIPT_ENDPOINT",
            "GOOGLE_HOME_SCRIPT_KEY"
        ],
    },
    db: {
        checkIntegrability: true,
        shutDownIfIntegrabilityFails: true,
        integrabilityValidations: [
            {
                daoName: 'hs',
                checkSchemes: true // Validate schema for ALL collections in this DAO
            },
            {
                daoName: 'hs',
                collectionName: 'services',
                query: {
                    key: 'main_food'
                },
                existence: true,
                runOnFail: 'init-service' // Auto-repair: run migration if validation fails
            }
        ]
    }
};
