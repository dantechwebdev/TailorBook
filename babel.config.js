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
      // react-native-reanimated/plugin intentionally NOT registered: the
      // dependency was installed but never imported anywhere (verified — zero
      // `worklet` usage, zero `from 'react-native-reanimated'` in src/). All
      // motion in this app runs on the built-in Animated API. Re-add both the
      // dependency and this plugin together if Reanimated is genuinely needed
      // later — don't pay its build-time transform cost for nothing.
    ],
  };
};
