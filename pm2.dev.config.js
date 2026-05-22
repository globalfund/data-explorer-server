module.exports = {
  apps: [
    {
      name: 'the-data-explorer-api-dev',
      script: 'yarn',
      args: 'dev',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      autorestart: true,
      watch: false,
    },
    {
      name: 'the-data-explorer-worker-dev',
      script: 'yarn',
      args: 'worker:dev',
      instances: 1,
      exec_mode: 'fork',
      interpreter: 'none',
      env: {
        NODE_ENV: 'development',
      },
      autorestart: true,
      watch: false,
    },
  ],
};
