module.exports = function (api) {
  api.cache(true);
  const isWeb = process.env.EXPO_TARGET === 'web' || process.env.WEBPACK_BUILD === '1';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
          extensions: isWeb
            ? ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js']
            : ['.tsx', '.ts', '.jsx', '.js'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
