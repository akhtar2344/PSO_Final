#!/usr/bin/env powershell
<#
.SYNOPSIS
    Move non-essential documentation files to /staging folder
    
.DESCRIPTION
    This script moves AI-generated documentation and temporary files to the /staging folder
    keeping the root directory clean while preserving all documentation for reference.
    
.NOTES
    Author: Project Organization Script
    Date: November 11, 2025
    Safe: Yes - only moves documentation files, no code changes
#>

param(
    [Switch]$DryRun = $false,  # If true, only shows what would be moved
    [Switch]$Verbose = $false  # Show detailed output
)

# Configuration
$rootPath = Get-Location
$stagingPath = Join-Path $rootPath "staging"
$docsPath = Join-Path $stagingPath "DOCUMENTATION"
$actionsPath = Join-Path $docsPath "ACTIONS_BUTTONS_FIX"
$cloudinaryPath = Join-Path $docsPath "CLOUDINARY_IMAGE_FIX"
$referencePath = Join-Path $stagingPath "REFERENCE"

# Files to move - ACTIONS BUTTONS FIX (13 files)
$actionsFiles = @(
    "SUMMARY_ACTIONS_FIX.md",
    "ACTIONS_BUTTONS_FIX.md",
    "TEST_ACTIONS_BUTTONS.md",
    "VISUAL_GUIDE_ACTIONS.md",
    "QUICK_REFERENCE_ACTIONS.md",
    "IMPLEMENTATION_SUMMARY.md",
    "DELIVERY_SUMMARY_ACTIONS.md",
    "DOCUMENTATION_INDEX_ACTIONS.md",
    "FINISH_ACTIONS_BUTTONS.md",
    "README_ACTIONS_BUTTONS.md",
    "00_FILE_LIST_ACTIONS.md",
    "FINAL_CHECKLIST_ACTIONS.md",
    "IMPLEMENTATION_COMPLETE_ACTIONS.txt"
)

# Files to move - CLOUDINARY & IMAGE FIX (8 files)
$cloudinaryFiles = @(
    "IMAGE_URL_FIX.md",
    "TEST_IMAGE_FIX.md",
    "CLOUDINARY_MIGRATION.md",
    "COMPLETE_GUIDE.md",
    "SETUP_CHECKLIST.md",
    "ARCHITECTURE.md",
    "TROUBLESHOOTING.md",
    "MIGRATION_SUMMARY.txt"
)

# Files to move - GENERAL REFERENCE (6 files)
$referenceFiles = @(
    "IMPLEMENTATION_SUMMARY.txt",
    "START_HERE.md",
    "QUICK_REFERENCE.md",
    "INDEX.md",
    "GUIDE.md",
    "00_READ_ME_FIRST.txt"
)

# Counters
$movedCount = 0
$skippedCount = 0
$errorCount = 0

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$warningColor = "Yellow"
$infoColor = "Cyan"

# Helper function to display messages
function Write-Status {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Helper function to move file safely
function Move-FileToStaging {
    param(
        [string]$FileName,
        [string]$DestinationFolder
    )
    
    $sourcePath = Join-Path $rootPath $FileName
    $destPath = Join-Path $DestinationFolder $FileName
    
    # Check if source file exists
    if (-Not (Test-Path $sourcePath)) {
        Write-Status "  ⚠️  SKIP: $FileName (file not found)" $warningColor
        $script:skippedCount++
        return
    }
    
    # Check if destination already exists
    if (Test-Path $destPath) {
        Write-Status "  ⚠️  SKIP: $FileName (already exists at destination)" $warningColor
        $script:skippedCount++
        return
    }
    
    try {
        if ($DryRun) {
            Write-Status "  [DRY RUN] Would move: $FileName" $infoColor
        } else {
            Copy-Item -Path $sourcePath -Destination $destPath -Force
            Remove-Item -Path $sourcePath -Force
            Write-Status "  ✅ MOVED: $FileName" $successColor
        }
        $script:movedCount++
    }
    catch {
        Write-Status "  ❌ ERROR: $FileName - $_" $errorColor
        $script:errorCount++
    }
}

# Main script
Write-Status "`n╔════════════════════════════════════════════════════════════════╗" $infoColor
Write-Status "║  📦 Moving Documentation Files to /staging Folder            ║" $infoColor
Write-Status "╚════════════════════════════════════════════════════════════════╝`n" $infoColor

if ($DryRun) {
    Write-Status "[DRY RUN MODE] - No files will be moved, only showing what would happen`n" $warningColor
}

# Verify staging directories exist
$stagingDirs = @($actionsPath, $cloudinaryPath, $referencePath)
foreach ($dir in $stagingDirs) {
    if (-Not (Test-Path $dir)) {
        Write-Status "❌ ERROR: Required directory missing: $dir" $errorColor
        exit 1
    }
}

Write-Status "📍 Root Path: $rootPath" $infoColor
Write-Status "📁 Staging Path: $stagingPath" $infoColor
Write-Status ""

# Move ACTIONS BUTTONS FIX files
Write-Status "📂 Moving ACTIONS BUTTONS FIX Documentation (13 files)..." $infoColor
Write-Status "   Destination: staging/DOCUMENTATION/ACTIONS_BUTTONS_FIX/" $infoColor
foreach ($file in $actionsFiles) {
    Move-FileToStaging -FileName $file -DestinationFolder $actionsPath
}
Write-Status ""

# Move CLOUDINARY & IMAGE FIX files
Write-Status "📂 Moving CLOUDINARY & IMAGE FIX Documentation (8 files)..." $infoColor
Write-Status "   Destination: staging/DOCUMENTATION/CLOUDINARY_IMAGE_FIX/" $infoColor
foreach ($file in $cloudinaryFiles) {
    Move-FileToStaging -FileName $file -DestinationFolder $cloudinaryPath
}
Write-Status ""

# Move REFERENCE files
Write-Status "📂 Moving REFERENCE Documentation (6 files)..." $infoColor
Write-Status "   Destination: staging/REFERENCE/" $infoColor
foreach ($file in $referenceFiles) {
    Move-FileToStaging -FileName $file -DestinationFolder $referencePath
}
Write-Status ""

# Summary
Write-Status "╔════════════════════════════════════════════════════════════════╗" $infoColor
Write-Status "║  📊 Summary                                                    ║" $infoColor
Write-Status "╚════════════════════════════════════════════════════════════════╝" $infoColor
Write-Status ""
Write-Status "✅ Successfully Moved:  $movedCount files" $successColor
Write-Status "⚠️  Skipped:            $skippedCount files" $warningColor
Write-Status "❌ Errors:              $errorCount files" $errorColor
Write-Status ""

# Final status
if ($errorCount -eq 0 -and $movedCount -gt 0) {
    Write-Status "✅ Organization Complete! Root directory cleaned." $successColor
    Write-Status ""
    Write-Status "📚 Documentation is now organized in:" $infoColor
    Write-Status "   • staging/DOCUMENTATION/ACTIONS_BUTTONS_FIX/" $infoColor
    Write-Status "   • staging/DOCUMENTATION/CLOUDINARY_IMAGE_FIX/" $infoColor
    Write-Status "   • staging/REFERENCE/" $infoColor
    Write-Status ""
    Write-Status "🔒 Note: /staging/ is added to .gitignore and won't be committed" $infoColor
    Write-Status ""
} elseif ($DryRun) {
    Write-Status "ℹ️  This was a DRY RUN. No files were actually moved." $infoColor
    Write-Status "    Run without -DryRun flag to actually move files." $infoColor
    Write-Status ""
} else {
    Write-Status "⚠️  Warning: Some files could not be moved. Please check the errors above." $warningColor
    Write-Status ""
}

Write-Status "✨ Organization script completed!" $successColor
Write-Status ""
