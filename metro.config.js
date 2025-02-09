// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Remove svg from assetExts so it isn’t treated as a static asset.
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
// Add svg to sourceExts so that it’s processed by the transformer.
config.resolver.sourceExts.push('svg');

// Tell Metro to use react-native-svg-transformer for svg files.
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

module.exports = config;
