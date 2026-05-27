module.exports = {
  apps: [
    {
      name: 'anjos-ambiental-api',
      script: 'dist/server.js',
      cwd: '/var/www/anjos-ambiental/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
