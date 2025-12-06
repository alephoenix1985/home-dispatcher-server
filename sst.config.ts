/// <reference types="./.sst/platform/config.d.ts" />

const SERVICE_NAME = 'db';

export default $config({
    async app(input) {
        const {appSSTInput} = await import("psf-core-shared/helpers/sst.helper.js");
        return appSSTInput(SERVICE_NAME, input, {region: "us-east-1", profile: 'ale02'});
    },
    async run() {
        const { appSST } = await import("psf-core-shared/helpers/sst.helper.js");
        return appSST(SERVICE_NAME, {$app, sst}, {
            stackConfig: {
                http: {
                    post: ["request"]
                }
            },
            parameterKeys: [
                "MONGO_URI",
                "AMAZON_SERVICE_SQS_DB_REQUESTS_QUEUE"
            ]
        });
    },
});
