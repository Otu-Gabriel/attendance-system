# PowerShell script to download Face API.js models
# Run with: .\scripts\download-models.ps1

$modelsDir = Join-Path $PSScriptRoot "..\public\models"
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Model files to download
$models = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_recognition_model-shard2"
)

# Create models directory if it doesn't exist
if (-not (Test-Path $modelsDir)) {
    New-Item -ItemType Directory -Path $modelsDir -Force | Out-Null
    Write-Host "Created models directory: $modelsDir" -ForegroundColor Green
}

Write-Host "Starting download of Face API.js models...`n" -ForegroundColor Cyan

$count = 0
foreach ($model in $models) {
    $count++
    $url = "$baseUrl/$model"
    $filepath = Join-Path $modelsDir $model
    
    try {
        Write-Host "[$count/$($models.Count)] Downloading $model..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $filepath -UseBasicParsing
        Write-Host "✓ Downloaded $model`n" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed to download $model : $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✓ All models downloaded successfully!" -ForegroundColor Green
Write-Host "Models are located at: $modelsDir" -ForegroundColor Cyan
