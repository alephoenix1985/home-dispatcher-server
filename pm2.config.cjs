/**
 * @file PM2 configuration for running the application in a container.
 */
module.exports = {
  apps: [
    {
      name: 'psf-db-offline',
      script: 'npm',
      args: 'run offline',
    },
  ],
};