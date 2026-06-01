param(
    [string]$Root,
    [string]$OutputDir,
    [string]$PackVersion
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = Resolve-Path (Join-Path $PSScriptRoot "..")
} else {
    $Root = Resolve-Path $Root
}

$Root = [System.IO.Path]::GetFullPath($Root)

function Read-VersionFile {
    param([string]$Path)

    $values = @{}
    Get-Content -LiteralPath $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            return
        }
        $parts = $line -split "=", 2
        if ($parts.Count -eq 2) {
            $values[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
    return $values
}

function Resolve-Or-CreateDirectory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }

    return (Resolve-Path -LiteralPath $Path).Path
}

function Assert-UnderPath {
    param(
        [string]$Path,
        [string]$Parent
    )

    $resolvedPath = [System.IO.Path]::GetFullPath($Path)
    $resolvedParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar)
    if (-not $resolvedPath.StartsWith($resolvedParent + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to operate outside package directory: $resolvedPath"
    }
}

$versionPath = Join-Path $Root "VERSION"
if (-not (Test-Path -LiteralPath $versionPath)) {
    throw "Missing VERSION under $Root"
}

$versions = Read-VersionFile -Path $versionPath
$modVersion = $versions["MOD_VERSION"]
if ([string]::IsNullOrWhiteSpace($PackVersion)) {
    $PackVersion = $versions["PACK_VERSION"]
}
if ([string]::IsNullOrWhiteSpace($modVersion) -or [string]::IsNullOrWhiteSpace($PackVersion)) {
    throw "VERSION must define MOD_VERSION and PACK_VERSION"
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path $Root "dist"
}
$distRoot = Resolve-Or-CreateDirectory $OutputDir

$sourceStrings = Join-Path $Root "strings"
if (-not (Test-Path -LiteralPath $sourceStrings)) {
    throw "Missing strings directory: $sourceStrings"
}

$safePackVersion = $PackVersion -replace "[^0-9A-Za-z._-]", "_"
$packageName = "EasternSunLAN_zhCN_pack_v$safePackVersion"
$stageRoot = Join-Path $distRoot $packageName
$zipPath = Join-Path $distRoot "$packageName.zip"

Assert-UnderPath -Path $stageRoot -Parent $distRoot
Assert-UnderPath -Path $zipPath -Parent $distRoot

if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
}
if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

$targetStrings = Join-Path $stageRoot "EasternSunLAN.mpq\data\local\lng\strings"
New-Item -ItemType Directory -Path $targetStrings | Out-Null
Copy-Item -Path (Join-Path $sourceStrings "*") -Destination $targetStrings -Recurse -Force

$mpqData = Join-Path $Root "mpq-data"
if (Test-Path -LiteralPath $mpqData) {
    $targetData = Join-Path $stageRoot "EasternSunLAN.mpq\data"
    New-Item -ItemType Directory -Path $targetData -Force | Out-Null
    Copy-Item -Path (Join-Path $mpqData "*") -Destination $targetData -Recurse -Force
}

$readme = @'
# EasternSunLAN 简体中文汉化包

适用模组版本：{{MOD_VERSION}}
汉化包版本：{{PACK_VERSION}}

## 安装

1. 关闭游戏和启动器。
2. 将本压缩包内容解压到 `D2R\Mods\EasternSunLAN\`。
3. 允许覆盖同名文件。
4. 启动 EasternSunLAN，并在游戏语言为简体中文时使用。

压缩包内路径从 `EasternSunLAN.mpq` 开始；覆盖后实际文件应位于：

`D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\local\lng\strings`

## 内容

本包只包含当前 D2R 字符串汉化资源，不包含玩法数据、存档、高清贴图或 `strings-legacy`。符文名按当前项目规则保留英文。

## 回退

覆盖前建议备份原目录：

`D2R\Mods\EasternSunLAN\EasternSunLAN.mpq\data\local\lng\strings`
'@

$readme = $readme.Replace("{{MOD_VERSION}}", $modVersion).Replace("{{PACK_VERSION}}", $PackVersion)
Set-Content -LiteralPath (Join-Path $stageRoot "README.md") -Value $readme -Encoding UTF8

$files = Get-ChildItem -LiteralPath $stageRoot -Recurse -File | Sort-Object FullName | ForEach-Object {
    $relativePath = [System.IO.Path]::GetRelativePath($stageRoot, $_.FullName) -replace "\\", "/"
    [ordered]@{
        path = $relativePath
        bytes = $_.Length
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$manifest = [ordered]@{
    packageName = $packageName
    modName = "EasternSunLAN"
    modVersion = $modVersion
    packVersion = $PackVersion
    builtAt = (Get-Date).ToString("o")
    installRoot = "D2R/Mods/EasternSunLAN"
    contentsRoot = "EasternSunLAN.mpq/data/local/lng/strings"
    fileCount = $files.Count
    files = $files
}

$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $stageRoot "manifest.json") -Encoding UTF8

Compress-Archive -Path (Join-Path $stageRoot "*") -DestinationPath $zipPath -Force

[ordered]@{
    package = $zipPath
    stage = $stageRoot
    modVersion = $modVersion
    packVersion = $PackVersion
    fileCount = $files.Count
    bytes = (Get-Item -LiteralPath $zipPath).Length
} | ConvertTo-Json
