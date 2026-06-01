param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath
)

$ErrorActionPreference = "Stop"

$ZipPath = (Resolve-Path -LiteralPath $ZipPath).Path
$zipItem = Get-Item -LiteralPath $ZipPath
$verifyRoot = Join-Path $zipItem.DirectoryName ("verify_" + [System.IO.Path]::GetFileNameWithoutExtension($zipItem.Name))

$verifyFull = [System.IO.Path]::GetFullPath($verifyRoot)
$parentFull = [System.IO.Path]::GetFullPath($zipItem.DirectoryName).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
if (-not $verifyFull.StartsWith($parentFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Bad verify path: $verifyFull"
}

if (Test-Path -LiteralPath $verifyRoot) {
    Remove-Item -LiteralPath $verifyRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $verifyRoot | Out-Null

try {
    Expand-Archive -LiteralPath $ZipPath -DestinationPath $verifyRoot -Force

    $manifestPath = Join-Path $verifyRoot "manifest.json"
    if (-not (Test-Path -LiteralPath $manifestPath)) {
        throw "Missing manifest.json"
    }

    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $requiredFiles = @(
        "EasternSunLAN.mpq/data/local/lng/strings/item-names.json",
        "EasternSunLAN.mpq/data/local/lng/strings-legacy/item-names.json",
        "EasternSunLAN.mpq/data/local/lng/strings-legacy/item-nameaffixes.json",
        "EasternSunLAN.mpq/data/D2RLAN/Filters/override_rules.lua"
    )
    $forbiddenFiles = @(
        "EasternSunLAN.mpq/data/D2RLAN/Filters/SunRise Filter.lua",
        "EasternSunLAN.mpq/data/D2RLAN/Filters/SunRise-Filter.lua"
    )

    $hashMismatches = @()
    foreach ($file in $manifest.files) {
        $path = Join-Path $verifyRoot ($file.path -replace "/", [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $path)) {
            $hashMismatches += "missing:$($file.path)"
            continue
        }
        $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($hash -ne $file.sha256) {
            $hashMismatches += "hash:$($file.path)"
        }
    }

    $missingRequiredFiles = @()
    foreach ($requiredFile in $requiredFiles) {
        $requiredPath = Join-Path $verifyRoot ($requiredFile -replace "/", [System.IO.Path]::DirectorySeparatorChar)
        if (-not (Test-Path -LiteralPath $requiredPath)) {
            $missingRequiredFiles += $requiredFile
        }
    }

    $forbiddenPackagedFiles = @()
    foreach ($forbiddenFile in $forbiddenFiles) {
        $forbiddenPath = Join-Path $verifyRoot ($forbiddenFile -replace "/", [System.IO.Path]::DirectorySeparatorChar)
        if (Test-Path -LiteralPath $forbiddenPath) {
            $forbiddenPackagedFiles += $forbiddenFile
        }
    }

    $jsonErrors = @()
    $jsonFiles = Get-ChildItem -LiteralPath $verifyRoot -Recurse -File -Filter "*.json"
    foreach ($jsonFile in $jsonFiles) {
        try {
            $null = Get-Content -LiteralPath $jsonFile.FullName -Raw | ConvertFrom-Json
        } catch {
            $jsonErrors += $jsonFile.FullName
        }
    }

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $zipEntries = $archive.Entries.Count
        $topLevel = $archive.Entries | ForEach-Object { ($_.FullName -split "/")[0] } | Where-Object { $_ } | Sort-Object -Unique
    } finally {
        $archive.Dispose()
    }

    [ordered]@{
        zip = $ZipPath
        zipBytes = $zipItem.Length
        zipEntries = $zipEntries
        manifestFiles = [int]$manifest.fileCount
        extractedFiles = (Get-ChildItem -LiteralPath $verifyRoot -Recurse -File).Count
        topLevel = $topLevel
        stringsRootPresent = Test-Path -LiteralPath (Join-Path $verifyRoot "EasternSunLAN.mpq\data\local\lng\strings")
        legacyStringsRootPresent = Test-Path -LiteralPath (Join-Path $verifyRoot "EasternSunLAN.mpq\data\local\lng\strings-legacy")
        filterOverridePresent = Test-Path -LiteralPath (Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\override_rules.lua")
        sunRiseFilterPresent = (
            (Test-Path -LiteralPath (Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\SunRise Filter.lua")) -or
            (Test-Path -LiteralPath (Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\SunRise-Filter.lua"))
        )
        missingRequiredFiles = $missingRequiredFiles.Count
        forbiddenPackagedFiles = $forbiddenPackagedFiles.Count
        hashMismatches = $hashMismatches.Count
        jsonFiles = $jsonFiles.Count
        jsonErrors = $jsonErrors.Count
    } | ConvertTo-Json

    if ($hashMismatches.Count -gt 0 -or $jsonErrors.Count -gt 0 -or $missingRequiredFiles.Count -gt 0 -or $forbiddenPackagedFiles.Count -gt 0) {
        exit 1
    }
} finally {
    if (Test-Path -LiteralPath $verifyRoot) {
        Remove-Item -LiteralPath $verifyRoot -Recurse -Force
    }
}
