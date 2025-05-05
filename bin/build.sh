#!/bin/bash
set -e

echo "Cleaning dist directory..."
rm -Rf ./dist

echo "Running TypeScript compiler..."
tsc -p ./tsconfig.json --skipLibCheck

echo "Copying package.json and README.md..."
cp package.json ./dist
cp README.md ./dist

echo "Creating bin directory..."
mkdir -p ./dist/bin

echo "Copying mcp-aggregator.mts..."
cp ./bin/mcp-aggregator.mts ./dist/bin/mcp-aggregator.js
cp ./bin/mcp-simple-server.mts ./dist/bin/mcp-simple-server.js

echo "Running sed commands..."
# Fix the shebang
sed -i '1c\#!/usr/bin/env node' ./dist/bin/mcp-aggregator.js
sed -i '1c\#!/usr/bin/env node' ./dist/bin/mcp-simple-server.js
# Fix the import paths
sed -i -e 's/..\/src\//..\//g' ./dist/bin/mcp-aggregator.js
sed -i -e 's/..\/src\//..\//g' ./dist/bin/mcp-simple-server.js
# Fix all .ts extensions in import statements
sed -i -e 's/\.ts/\.js/g' ./dist/bin/mcp-aggregator.js
sed -i -e 's/\.ts/\.js/g' ./dist/bin/mcp-simple-server.js
