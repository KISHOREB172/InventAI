[CmdletBinding()]
param(
    [string]$ApiUrl = $env:VITE_API_URL,
    [switch]$SkipChecks,
    [switch]$SkipReleaseBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$Description,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Description failed with exit code $LASTEXITCODE."
    }
}

function Get-SafeRelativePath {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)][string]$FullName
    )

    $rootPrefix = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $resolvedFile = [IO.Path]::GetFullPath($FullName)
    if (-not $resolvedFile.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "File is outside the expected asset directory: $resolvedFile"
    }
    return $resolvedFile.Substring($rootPrefix.Length).Replace("\", "/")
}

$androidRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$frontendRoot = [IO.Path]::GetFullPath((Join-Path $androidRoot ".."))
$generatedWebAssets = [IO.Path]::GetFullPath(
    (Join-Path $androidRoot "app\src\main\assets\public")
)
$expectedGeneratedWebAssets = [IO.Path]::GetFullPath(
    (Join-Path $androidRoot "app\src\main\assets\public")
)
$androidPrefix = $androidRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

if (
    $generatedWebAssets -cne $expectedGeneratedWebAssets -or
    -not $generatedWebAssets.StartsWith($androidPrefix, [StringComparison]::OrdinalIgnoreCase)
) {
    throw "Refusing to clean an unexpected generated-assets path: $generatedWebAssets"
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
    throw "VITE_API_URL is required for a release and must be an HTTPS URL."
}

$parsedApiUrl = $null
if (-not [Uri]::TryCreate($ApiUrl, [UriKind]::Absolute, [ref]$parsedApiUrl)) {
    throw "VITE_API_URL is not a valid absolute URL."
}
if ($parsedApiUrl.Scheme -ne "https" -or $parsedApiUrl.IsLoopback) {
    throw "Release VITE_API_URL must use HTTPS and must not point to localhost."
}

$previousApiUrl = $env:VITE_API_URL
Push-Location $frontendRoot
try {
    $env:VITE_API_URL = $parsedApiUrl.AbsoluteUri.TrimEnd("/")

    Invoke-Checked "Web production build" { & npm.cmd run build }

    if (Test-Path -LiteralPath $generatedWebAssets) {
        Remove-Item -LiteralPath $generatedWebAssets -Recurse -Force
    }

    Invoke-Checked "Capacitor Android synchronization" { & npx.cmd cap sync android }

    $distAssets = [IO.Path]::GetFullPath((Join-Path $frontendRoot "dist\assets"))
    $nativeAssets = [IO.Path]::GetFullPath((Join-Path $generatedWebAssets "assets"))
    if (-not (Test-Path -LiteralPath $distAssets) -or -not (Test-Path -LiteralPath $nativeAssets)) {
        throw "The synchronized web asset directories are missing."
    }

    $distFiles = @(
        Get-ChildItem -LiteralPath $distAssets -Recurse -File |
            ForEach-Object { Get-SafeRelativePath -Root $distAssets -FullName $_.FullName } |
            Sort-Object
    )
    $nativeFiles = @(
        Get-ChildItem -LiteralPath $nativeAssets -Recurse -File |
            ForEach-Object { Get-SafeRelativePath -Root $nativeAssets -FullName $_.FullName } |
            Sort-Object
    )
    $assetDifference = @(Compare-Object -ReferenceObject $distFiles -DifferenceObject $nativeFiles)
    if ($assetDifference.Count -ne 0) {
        throw "Android contains stale or missing hashed web assets after synchronization."
    }

    foreach ($relativePath in $distFiles) {
        $platformPath = $relativePath.Replace("/", [IO.Path]::DirectorySeparatorChar)
        $distHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $distAssets $platformPath)).Hash
        $nativeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $nativeAssets $platformPath)).Hash
        if ($distHash -ne $nativeHash) {
            throw "Synchronized asset content differs: $relativePath"
        }
    }

    if (-not $SkipChecks) {
        Invoke-Checked "Android unit tests and lint" {
            & .\android\gradlew.bat -p .\android :app:testDebugUnitTest :app:lintDebug :app:assembleDebugAndroidTest
        }
    }

    if (-not $SkipReleaseBuild) {
        Invoke-Checked "Release signing validation" {
            & .\android\gradlew.bat -p .\android validateReleaseSigning
        }
        Invoke-Checked "Signed Android release build" {
            & .\android\gradlew.bat -p .\android clean assembleRelease
        }
        Write-Host "Release APK: $androidRoot\app\build\outputs\apk\release\app-release.apk"
    }
    else {
        Invoke-Checked "Integrated Android debug build" {
            & .\android\gradlew.bat -p .\android :app:assembleDebug
        }
        Write-Host "Debug APK: $androidRoot\app\build\outputs\apk\debug\app-debug.apk"
    }
}
finally {
    if ($null -eq $previousApiUrl) {
        Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
    }
    else {
        $env:VITE_API_URL = $previousApiUrl
    }
    Pop-Location
}
