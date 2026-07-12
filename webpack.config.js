const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-navigation'],
      },
    },
    argv
  );

  config.devServer = {
    ...config.devServer,
    host: '0.0.0.0',
    allowedHosts: 'all',
    port: 5000,
  };

  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: false,
  };

  if (config.resolve.extensions) {
    const exts = config.resolve.extensions;
    const webFirst = [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      ...exts.filter(
        (e) => !['.web.tsx', '.web.ts', '.web.jsx', '.web.js'].includes(e)
      ),
    ];
    config.resolve.extensions = webFirst;
  }

  return config;
};
