$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $repoRoot "samples"
$outputPath = Join-Path $outputDir "samplehierarchy_cebu.json"

$mysqlCandidates = @(
  "C:\\wamp64\\bin\\mysql\\mysql8.2.0\\bin\\mysql.exe",
  "C:\\wamp64\\bin\\mysql\\mysql5.7.44\\bin\\mysql.exe",
  "C:\\wamp64\\bin\\mariadb\\mariadb11.2.2\\bin\\mysql.exe"
)

$mysqlExe = $mysqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $mysqlExe) {
  throw "No mysql client found under C:\\wamp64\\bin\\mysql or C:\\wamp64\\bin\\mariadb."
}

function Invoke-MySqlQuery {
  param(
    [string] $Query
  )

  $raw = & $mysqlExe `
    --default-character-set=utf8mb4 `
    -h localhost `
    -u root `
    -D pbb_hq_ph `
    --batch `
    --raw `
    -e $Query

  if (-not $raw) {
    return @()
  }

  $rows = $raw -split "`r?`n" | Where-Object { $_ -ne "" }
  if ($rows.Count -le 1) {
    return @()
  }

  return $rows | ConvertFrom-Csv -Delimiter "`t"
}

function New-Node {
  param(
    [string] $Id,
    [string] $Label,
    [string] $Type,
    [hashtable] $Meta = @{},
    [object[]] $Children = @()
  )

  $node = [ordered]@{
    id = $Id
    label = $Label
    type = $Type
  }

  if ($Meta.Count -gt 0) {
    $node.meta = $Meta
  }
  if ($Children.Count -gt 0) {
    $node.children = $Children
    $node.hasChildren = $true
  } else {
    $node.children = @()
    $node.hasChildren = $false
  }

  return $node
}

$region = Invoke-MySqlQuery @"
SELECT id, psgcCode, name, code, regCode, areaName
FROM geo_regions
WHERE regCode = '07'
LIMIT 1;
"@ | Select-Object -First 1

$province = Invoke-MySqlQuery @"
SELECT id, psgcCode, name, regCode, provCode
FROM geo_provinces
WHERE provCode = '0722'
LIMIT 1;
"@ | Select-Object -First 1

$cities = Invoke-MySqlQuery @"
SELECT id, psgcCode, name, regCode, provCode, citymunCode, lat, lon
FROM geo_cities
WHERE citymunCode IN ('072217', '072226', '072230')
ORDER BY name;
"@

$barangays = Invoke-MySqlQuery @"
SELECT citymunCode, name, brgyCode, lat, lon
FROM geo_barangays
WHERE citymunCode IN ('072217', '072226', '072230')
ORDER BY citymunCode, name;
"@

$cityNodes = @()
$barangayIndex = @{}

foreach ($city in $cities) {
  $cityBarangays = @(
    $barangays |
      Where-Object { $_.citymunCode -eq $city.citymunCode } |
      ForEach-Object {
        $barangayNode = New-Node -Id ("barangay-" + $_.brgyCode) `
          -Label $_.name `
          -Type "barangay" `
          -Meta ([ordered]@{
            brgyCode = $_.brgyCode
            citymunCode = $_.citymunCode
            lat = [double]$_.lat
            lng = [double]$_.lon
            status = "planned"
          })

        $barangayIndex[$barangayNode.id] = $barangayNode
        $barangayNode
      }
  )

  $cityNodes += New-Node -Id ("city-" + $city.citymunCode) `
    -Label $city.name `
    -Type "city" `
    -Meta ([ordered]@{
      psgcCode = $city.psgcCode
      regCode = $city.regCode
      provCode = $city.provCode
      citymunCode = $city.citymunCode
      lat = [double]$city.lat
      lng = [double]$city.lon
      barangayCount = $cityBarangays.Count
      status = "planned"
    }) `
    -Children $cityBarangays
}

$provinceNode = New-Node -Id ("province-" + $province.provCode) `
  -Label $province.name `
  -Type "province" `
  -Meta ([ordered]@{
    psgcCode = $province.psgcCode
    regCode = $province.regCode
    provCode = $province.provCode
    cityCount = $cityNodes.Count
    status = "planned"
  }) `
  -Children $cityNodes

$regionNode = New-Node -Id ("region-" + $region.regCode) `
  -Label $region.name `
  -Type "region" `
  -Meta ([ordered]@{
    psgcCode = $region.psgcCode
    code = $region.code
    regCode = $region.regCode
    areaName = $region.areaName
    provinceCount = 1
    status = "planned"
  }) `
  -Children @($provinceNode)

$rootNode = New-Node -Id "country-ph" `
  -Label "Philippines" `
  -Type "country" `
  -Meta ([ordered]@{
    countryCode = "PH"
    status = "planned"
  }) `
  -Children @($regionNode)

$foundations = @(
  [ordered]@{ id = "foundation-abc"; label = "ABC Foundation"; type = "foundation"; meta = [ordered]@{ status = "online"; region = "Region VII" } },
  [ordered]@{ id = "foundation-bayanihan"; label = "Bayanihan Network"; type = "foundation"; meta = [ordered]@{ status = "online"; region = "Region VII" } },
  [ordered]@{ id = "foundation-civic-bridge"; label = "Civic Bridge Trust"; type = "foundation"; meta = [ordered]@{ status = "online"; region = "Region VII" } },
  [ordered]@{ id = "foundation-rural-link"; label = "Rural Link Foundation"; type = "foundation"; meta = [ordered]@{ status = "online"; region = "Region VII" } },
  [ordered]@{ id = "foundation-uplift"; label = "Uplift Communities"; type = "foundation"; meta = [ordered]@{ status = "online"; region = "Region VII" } }
)

$foundationTargets = [ordered]@{
  "foundation-abc" = @("barangay-072217029", "barangay-072217041", "barangay-072230010", "barangay-072226021")
  "foundation-bayanihan" = @("barangay-072217007", "barangay-072217081", "barangay-072230026", "barangay-072226015")
  "foundation-civic-bridge" = @("barangay-072217046", "barangay-072230022", "barangay-072226012", "barangay-072226016")
  "foundation-rural-link" = @("barangay-072217001", "barangay-072217030", "barangay-072230007", "barangay-072226024", "barangay-072226029")
  "foundation-uplift" = @("barangay-072217029", "barangay-072217041", "barangay-072230018", "barangay-072226005", "barangay-072226021")
}

$links = @()
foreach ($foundation in $foundations) {
  $targets = $foundationTargets[$foundation.id]
  foreach ($targetId in $targets) {
    if (-not $barangayIndex.Contains($targetId)) {
      continue
    }

    $links += [ordered]@{
      id = ("link-" + $foundation.id + "-" + $targetId)
      from = $foundation.id
      to = $targetId
      type = "support"
      label = "Foundation Support"
      tone = "info"
      dashed = $true
      meta = [ordered]@{
        status = "active"
      }
    }
  }
}

$payload = [ordered]@{
  generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssK")
  source = [ordered]@{
    database = "pbb_hq_ph"
    hierarchy = "real"
    overlays = "synthetic"
    scope = "Philippines -> Region VII -> Cebu -> Cebu City, Lapu-Lapu City (Opon), Mandaue City"
  }
  stats = [ordered]@{
    cityCount = $cityNodes.Count
    barangayCount = $barangays.Count
    foundationCount = $foundations.Count
    overlayLinkCount = $links.Count
  }
  root = $rootNode
  externals = $foundations
  links = $links
}

$payload | ConvertTo-Json -Depth 100 | Set-Content $outputPath
Write-Host "Wrote $outputPath"
