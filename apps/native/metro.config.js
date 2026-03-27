const fs = require("fs");
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const realWorkspaceRoot = fs.realpathSync.native(workspaceRoot);

function uniquePaths(paths) {
  return [...new Set(paths)];
}

const config = getDefaultConfig(projectRoot);

config.watchFolders = uniquePaths([
  workspaceRoot,
  realWorkspaceRoot,
  path.resolve(workspaceRoot, "packages"),
  path.resolve(realWorkspaceRoot, "packages"),
]);
config.resolver.nodeModulesPaths = uniquePaths([
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(realWorkspaceRoot, "node_modules"),
]);
config.resolver.extraNodeModules = {
  "@golfers-nation/backend": path.resolve(realWorkspaceRoot, "packages/backend"),
  "@golfers-nation/core": path.resolve(realWorkspaceRoot, "packages/core"),
  "@golfers-nation/course": path.resolve(realWorkspaceRoot, "packages/course"),
};

module.exports = config;
