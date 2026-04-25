const path = require('path');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getSentryExpoConfig(projectRoot);

// 1. Watch all files in the monorepo so Metro picks up package edits.
config.watchFolders = [workspaceRoot];

// 2. Let Metro resolve node_modules from both the app and the repo root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Do not follow symlinks out of the monorepo (npm workspaces keeps them inside).
config.resolver.disableHierarchicalLookup = true;

module.exports = config;