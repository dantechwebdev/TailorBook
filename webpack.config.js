const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

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

  // Forward GEMINI_API_KEY secret → EXPO_PUBLIC_GEMINI_API_KEY inside the bundle.
  // This lets the Gemini provider read it via process.env.EXPO_PUBLIC_GEMINI_API_KEY
  // without requiring a separate EXPO_PUBLIC_ secret.
  config.plugins = (config.plugins || []).concat(
    new webpack.DefinePlugin({
      'process.env.EXPO_PUBLIC_GEMINI_API_KEY': JSON.stringify(
        process.env.GEMINI_API_KEY || ''
      ),
    })
  );

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
