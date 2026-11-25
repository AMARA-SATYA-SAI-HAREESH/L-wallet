// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support ethers.js and other packages that reference Node.js built-ins
config.resolver.extraNodeModules = {
  crypto: require.resolve('react-native-get-random-values'),
  stream: require.resolve('stream-browserify'),
};

// Ensure ethers ESM build is handled properly
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
