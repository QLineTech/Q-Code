#!/bin/bash

# ./util/build_linux.sh

# Move to the root directory (one level up from script location)
cd "$(dirname "$0")/.."

# Read package.json and extract current version
package_json="package.json"
current_version=$(jq -r '.version' "$package_json")

# Split version into major, minor, patch
IFS='.' read -r major minor patch <<< "$current_version"

# Increment patch version
patch=$((patch + 1))
new_version="$major.$minor.$patch"

# Update package.json with new version
jq --arg new_version "$new_version" '.version = $new_version' "$package_json" > tmp.json && mv tmp.json "$package_json"
echo "Version updated to $new_version in package.json"

# Run vsce package
echo "Packaging the extension..."
vsce package

# Construct VSIX filename
vsix_file="qcode-$new_version.vsix"

# Wait for the VSIX file to be generated and install it
if [ -f "$vsix_file" ]; then
    echo "Installing $vsix_file into VS Code..."
    /usr/bin/code --install-extension "$vsix_file"
    echo "Extension v$new_version installed successfully!"
else
    echo "Error: VSIX file '$vsix_file' not found after packaging."
    exit 1
fi