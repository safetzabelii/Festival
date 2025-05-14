#!/bin/bash

# This script helps debug and fix common Render deployment issues

# Print environment for debugging (excluding secrets)
echo "===== Environment ====="
env | grep -v -E 'SECRET|PASSWORD|KEY'
echo "======================="

# Make sure build directory exists
mkdir -p dist

# Check if dist directory was created in the wrong location and copy files if needed
if [ ! -f ./dist/index.js ] && [ -f ../dist/index.js ]; then
  echo "Found index.js in parent directory, copying to current directory"
  cp -r ../dist/* ./dist/
fi

# Check if TypeScript is installed globally, if not install it
if ! command -v tsc &> /dev/null; then
  echo "TypeScript not found, installing globally"
  npm install -g typescript
fi

# If dist/index.js still doesn't exist, try building again
if [ ! -f ./dist/index.js ]; then
  echo "index.js not found in dist, attempting to rebuild"
  npx tsc -p tsconfig.json
fi

# Print output directory contents
echo "===== dist directory contents ====="
ls -la ./dist
echo "=================================="

echo "Setup completed" 