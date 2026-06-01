param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath
)

$ErrorActionPreference = "Stop"

$ZipPath = (Resolve-Path -LiteralPath $ZipPath).Path
$zipItem = Get-Item -LiteralPath $ZipPath
$verifyRoot = Join-Path $zipItem.DirectoryName ("test_pack_contents_" + [System.IO.Path]::GetFileNameWithoutExtension($zipItem.Name))

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
    $filterPath = Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\override_rules.lua"
    if (-not (Test-Path -LiteralPath $filterPath)) {
        throw "Missing packaged filter override: EasternSunLAN.mpq/data/D2RLAN/Filters/override_rules.lua"
    }

    $sunRiseFilterPaths = @(
        (Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\SunRise Filter.lua"),
        (Join-Path $verifyRoot "EasternSunLAN.mpq\data\D2RLAN\Filters\SunRise-Filter.lua")
    )
    foreach ($sunRiseFilterPath in $sunRiseFilterPaths) {
        if (Test-Path -LiteralPath $sunRiseFilterPath) {
            throw "SunRise filter should not be packaged: $sunRiseFilterPath"
        }
    }

    $legacyItemNamesPath = Join-Path $verifyRoot "EasternSunLAN.mpq\data\local\lng\strings-legacy\item-names.json"
    if (-not (Test-Path -LiteralPath $legacyItemNamesPath)) {
        throw "Missing packaged legacy item names: EasternSunLAN.mpq/data/local/lng/strings-legacy/item-names.json"
    }

    $filterText = Get-Content -LiteralPath $filterPath -Raw
    if ($filterText -notmatch '法力值') {
        throw "Packaged filter override does not look localized"
    }

    $legacyItemNamesText = Get-Content -LiteralPath $legacyItemNamesPath -Raw
    if ($legacyItemNamesText -match '"zhCN"\s*:\s*""') {
        throw "Packaged legacy item names contain blank zhCN values"
    }

    [ordered]@{
        zip = $ZipPath
        filterOverridePresent = $true
        filterOverrideBytes = (Get-Item -LiteralPath $filterPath).Length
        sunRiseFilterPresent = $false
        legacyItemNamesPresent = $true
        legacyItemNamesBytes = (Get-Item -LiteralPath $legacyItemNamesPath).Length
    } | ConvertTo-Json
} finally {
    if (Test-Path -LiteralPath $verifyRoot) {
        Remove-Item -LiteralPath $verifyRoot -Recurse -Force
    }
}
