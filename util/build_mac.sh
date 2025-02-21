#!/bin/bash
# ./util/build_mac.sh

# Move to the root directory (one level up from script location)
cd "$(dirname "$0")/.."

# Create builds directory if it doesn't exist
builds_dir="builds"
mkdir -p "$builds_dir"

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

# Run vsce package with output directory specified
echo "Packaging the extension..."
vsix_file="qcode-$new_version.vsix"
vsix_path="$builds_dir/$vsix_file"
vsce package -o "$vsix_path"

# Wait for the VSIX file to be generated and install it
if [ -f "$vsix_path" ]; then
    echo "Installing $vsix_file into VS Code..."
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" --install-extension "$vsix_path"
    echo "Extension v$new_version installed successfully!"
else
    echo "Error: VSIX file '$vsix_path' not found after packaging."
    exit 1
fi