import { sayHola } from 'psf-core/helpers/test.helper.js';

/**
 * A diagnostic Lambda handler to test the resolution of the 'psf-core' alias.
 */
export const handler = async () => {
    console.log("Executing test handler...");
    const message = sayHola();
    return {
        statusCode: 200,
        body: JSON.stringify({ message }),
    };
};
