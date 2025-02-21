# ./util/build.ps1

# Move to the root directory (one level up from script location)
Set-Location -Path $PSScriptRoot\..

# Read package.json and parse it
$packageJsonPath = "package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json

# Get the current version and split it into components
$currentVersion = $packageJson.version
$versionParts = $currentVersion -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Increment the patch version (you can modify to increment major/minor instead)
$patch += 1
$newVersion = "$major.$minor.$patch"

# Update the version in the package.json object
$packageJson.version = $newVersion

# Write the updated package.json back to file
$packageJson | ConvertTo-Json -Depth 100 | Set-Content -Path $packageJsonPath
Write-Host "Version updated to $newVersion in package.json"

# Run vsce package
Write-Host "Packaging the extension..."
vsce package

# Construct the VSIX filename
$vsixFile = "qcode-$newVersion.vsix"

# Path to stable VS Code (adjust if your installation path is different)
$codePath = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"

# Wait for the VSIX file to be generated and install it
if (Test-Path $vsixFile) {
    Write-Host "Installing $vsixFile into VS Code..."
    & $codePath --install-extension $vsixFile
    Write-Host "Extension v$newVersion installed successfully!"
} else {
    Write-Error "VSIX file '$vsixFile' not found after packaging."
    exit 1
}