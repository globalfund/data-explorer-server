module.exports = {
  apps: [
    {
      name: 'the-data-explorer-api',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '2G',
      autorestart: true,
      restart_delay: 100,
      error_file: '/home/zim/app-logs/the-data-explorer-api/error.log',
      out_file: '/home/zim/app-logs/the-data-explorer-api/out.log',
      watch: true,
      ignore_watch: [
        '.git',
        '.circle',
        '.vscode',
        'README.md',
        'yarn.lock',
        '.gitignore',
        'node_modules',
        'package.json',
        'tsconfig.json',
      ],
    },
  ],
};
