#!/bin/bash
# ./util/build_linux.sh

# Move to the root directory (one level up from script location)
cd "$(dirname "$0")/.."

# Create builds directory if it doesn't exist
builds_dir="builds"
mkdir -p "$builds_dir"

# Read package.json and extract package name and current version
package_json="package.json"
package_name=$(jq -r '.name' "$package_json")
current_version=$(jq -r '.version' "$package_json")

# Function to compare version strings
version_gt() {
    test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"
}

# Check for existing versions in builds directory
latest_version=""
if ls "$builds_dir"/$package_name-*.vsix 1> /dev/null 2>&1; then
    latest_version=$(ls -t "$builds_dir"/$package_name-*.vsix | head -n1 | sed -E "s/.*$package_name-([0-9]+\.[0-9]+\.[0-9]+)\.vsix/\1/")
    echo "Found existing version: $latest_version"
    
    # Compare with current version
    if version_gt "$latest_version" "$current_version"; then
        # Increment from the latest found version
        IFS='.' read -r major minor patch <<< "$latest_version"
        patch=$((patch + 1))
        new_version="$major.$minor.$patch"
    else
        # Use version from package.json as it's newer
        new_version=$current_version
    fi
else
    echo "No existing versions found"
    new_version=$current_version
fi

# Update package.json with new version
jq --arg new_version "$new_version" '.version = $new_version' "$package_json" > tmp.json && mv tmp.json "$package_json"
echo "Version updated to $new_version in package.json"

# Run vsce package with output directory specified
echo "Packaging the extension..."
vsix_file="$package_name-$new_version.vsix"
vsix_path="$builds_dir/$vsix_file"
vsce package -o "$vsix_path"

# Wait for the VSIX file to be generated and install it
if [ -f "$vsix_path" ]; then
    echo "Installing $vsix_file into VS Code..."
    code --install-extension "$vsix_path"
    echo "Extension v$new_version installed successfully!"
else
    echo "Error: VSIX file '$vsix_path' not found after packaging."
    exit 1
fi