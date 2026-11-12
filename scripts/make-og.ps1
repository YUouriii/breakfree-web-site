# Regenerates public/og.png (the 1200x630 social-share card).
# Run from the project root:  powershell -File scripts/make-og.ps1

Add-Type -AssemblyName System.Drawing

$w = 1200; $h = 630
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$paper     = [System.Drawing.Color]::FromArgb(255, 246, 241, 231)
$ink       = [System.Drawing.Color]::FromArgb(255, 33, 29, 22)
$inkSoft   = [System.Drawing.Color]::FromArgb(255, 110, 101, 84)
$dawn      = [System.Drawing.Color]::FromArgb(255, 193, 78, 36)
$dawnGlow  = [System.Drawing.Color]::FromArgb(70, 232, 130, 76)

$bg       = New-Object System.Drawing.SolidBrush $paper
$inkBrush = New-Object System.Drawing.SolidBrush $ink
$softBrush = New-Object System.Drawing.SolidBrush $inkSoft
$dawnBrush = New-Object System.Drawing.SolidBrush $dawn
$glowBrush = New-Object System.Drawing.SolidBrush $dawnGlow

$g.FillRectangle($bg, 0, 0, $w, $h)

# horizon hairline + rising sun (right side), half-disc sitting on the line
$hair = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 33, 29, 22)), 2
$g.DrawLine($hair, 0, 470, $w, 470)
$g.FillEllipse($glowBrush, 720, 300, 360, 360)
$g.FillEllipse($dawnBrush, 790, 360, 220, 220)
$cover = New-Object System.Drawing.SolidBrush $paper
$g.FillRectangle($cover, 0, 473, $w, $h - 473)

# small caps kicker
$fontLabel = New-Object System.Drawing.Font ("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
$g.DrawString("OPEN SOURCE  -  ANDROID  -  ENGLISH / ARABIC", $fontLabel, $softBrush, 90, 78)

# headline in two voices
$fontH = New-Object System.Drawing.Font ("Georgia", 84, [System.Drawing.FontStyle]::Bold)
$g.DrawString("The fight is private.", $fontH, $inkBrush, 84, 150)
$g.DrawString("So is the help.", $fontH, $dawnBrush, 84, 258)

# subtitle — bilingual
$fontSub = New-Object System.Drawing.Font ("Segoe UI", 32)
$g.DrawString("BreakFree - " + [char]0x062A + [char]0x0639 + [char]0x0627 + [char]0x0641 + [char]0x064A + "  ·  a recovery companion for Android", $fontSub, $softBrush, 90, 396)

# bottom url
$fontMono = New-Object System.Drawing.Font ("Consolas", 24)
$g.DrawString("github.com/YUouriii/taafi-app", $fontMono, $softBrush, 88, 540)

$g.Dispose()
$bmp.Save((Join-Path $PSScriptRoot "..\public\og.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "og.png written"
