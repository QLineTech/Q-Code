# ./util/build_win.ps1

# Move to the root directory (one level up from script location)
Set-Location -Path $PSScriptRoot\..

# Create builds directory if it doesn't exist
$buildsDir = "builds"
if (-not (Test-Path $buildsDir)) {
    New-Item -ItemType Directory -Path $buildsDir
}

# Read package.json and parse it
$packageJsonPath = "package.json"
$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
$packageName = $packageJson.name

# Get current version
$currentVersion = $packageJson.version

# Check for existing versions in builds directory
$existingVersions = Get-ChildItem -Path $buildsDir -Filter "$packageName-*.vsix" | 
    ForEach-Object { 
        if ($_.Name -match "$packageName-(\d+\.\d+\.\d+)\.vsix") {
            [Version]$matches[1]
        }
    } |
    Sort-Object -Descending

if ($existingVersions) {
    $latestVersion = $existingVersions[0]
    Write-Host "Found existing version: $latestVersion"
    
    # Compare with current version
    if ([Version]$currentVersion -le $latestVersion) {
        # Increment from the latest found version
        $versionParts = $latestVersion.ToString() -split '\.'
        $major = [int]$versionParts[0]
        $minor = [int]$versionParts[1]
        $patch = [int]$versionParts[2] + 1
        $newVersion = "$major.$minor.$patch"
    } else {
        # Use version from package.json as it's newer
        $newVersion = $currentVersion
    }
} else {
    Write-Host "No existing versions found"
    $newVersion = $currentVersion
}

# Update the version in package.json
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 100 | Set-Content -Path $packageJsonPath
Write-Host "Version updated to $newVersion in package.json"

# Run vsce package with output directory specified
Write-Host "Packaging the extension..."
$vsixFile = "$packageName-$newVersion.vsix"
$vsixPath = Join-Path $buildsDir $vsixFile
vsce package -o $vsixPath

# Path to stable VS Code
$codePath = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"

# Wait for the VSIX file to be generated and install it
if (Test-Path $vsixPath) {
    Write-Host "Installing $vsixFile into VS Code..."
    & $codePath --install-extension $vsixPath
    Write-Host "Extension v$newVersion installed successfully!"
} else {
    Write-Error "VSIX file '$vsixPath' not found after packaging."
    exit 1
}