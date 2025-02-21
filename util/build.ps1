# ./util/build.ps1

# Ensure we're in the correct directory (root of the extension)
Set-Location -Path $PSScriptRoot\..

# Build the package using vsce
Write-Host "Packaging the QCode extension..."
$packageProcess = Start-Process -FilePath "vsce" -ArgumentList "package" -NoNewWindow -Wait -PassThru

# Check if packaging was successful
if ($packageProcess.ExitCode -ne 0) {
    Write-Error "Failed to package the extension. Check the output above for errors."
    exit $packageProcess.ExitCode
}

# Get the version from package.json
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$version = $packageJson.version
$vsixFile = "qcode-$version.vsix"

# Verify the .vsix file exists
if (-Not (Test-Path $vsixFile)) {
    Write-Error "VSIX file '$vsixFile' not found. Packaging may have failed."
    exit 1
}

# Install the extension into VS Code
Write-Host "Installing $vsixFile into VS Code..."
$installProcess = Start-Process -FilePath "code" -ArgumentList "--install-extension", $vsixFile -NoNewWindow -Wait -PassThru

# Check if installation was successful
if ($installProcess.ExitCode -ne 0) {
    Write-Error "Failed to install the extension. Check VS Code compatibility or permissions."
    exit $installProcess.ExitCode
}

Write-Host "QCode extension v$version successfully built and installed!"