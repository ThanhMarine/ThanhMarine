# Generates the social preview and app icons used by the site.
# Usage: pwsh -File scripts/make-assets.ps1
# Requires Windows (System.Drawing).

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "assets"
New-Item -ItemType Directory -Force -Path $assets | Out-Null

function C([string]$hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

function New-Pen([string]$hex, [float]$width, [string]$dash = "Solid") {
  $pen = [System.Drawing.Pen]::new((C $hex), $width)
  $pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::$dash
  return $pen
}

function New-Font([string]$family, [float]$pixels, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return [System.Drawing.Font]::new($family, $pixels, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Png($bitmap, [string]$path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

# ---------------------------------------------------------
# Open Graph image: 1200 x 630
# ---------------------------------------------------------

$og = [System.Drawing.Bitmap]::new(1200, 630)
$g = [System.Drawing.Graphics]::FromImage($og)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear((C "#f7f5ef"))

$gridPen = New-Pen "#e8e3d7" 1
for ($x = 0; $x -le 1200; $x += 60) { $g.DrawLine($gridPen, $x, 0, $x, 630) }
for ($y = 0; $y -le 630; $y += 60) { $g.DrawLine($gridPen, 0, $y, 1200, $y) }
$gridPen.Dispose()

$framePen = New-Pen "#dcd6c8" 1.2
$g.DrawRectangle($framePen, 24, 24, 1152, 582)
$framePen.Dispose()

$ink = New-Object System.Drawing.SolidBrush((C "#0c1b26"))
$soft = New-Object System.Drawing.SolidBrush((C "#3d515c"))
$muted = New-Object System.Drawing.SolidBrush((C "#687b85"))
$teal = New-Object System.Drawing.SolidBrush((C "#0b6b68"))
$signal = New-Object System.Drawing.SolidBrush((C "#b9541f"))
$paper = New-Object System.Drawing.SolidBrush((C "#f7f5ef"))

$fontEyebrow = New-Font "Consolas" 16
$fontTitle = New-Font "Georgia" 58 ([System.Drawing.FontStyle]::Bold)
$fontTitleItalic = New-Font "Georgia" 58 ([System.Drawing.FontStyle]::Italic)
$fontMeta = New-Font "Consolas" 14
$fontUrl = New-Font "Georgia" 21
$fontCompass = New-Font "Georgia" 24 ([System.Drawing.FontStyle]::Bold)
$fontCoord = New-Font "Consolas" 12
$fontFig = New-Font "Consolas" 13

$g.DrawString("ADEN NGUYEN  /  THÀNH MARINE", $fontEyebrow, $signal, 80, 84)
$g.DrawString("Engineering smart", $fontTitle, $ink, 76, 150)
$g.DrawString("solutions for a", $fontTitle, $ink, 76, 220)
$g.DrawString("simpler life.", $fontTitleItalic, $teal, 76, 290)

$accentPen = New-Pen "#b9541f" 3
$g.DrawLine($accentPen, 80, 386, 152, 386)
$accentPen.Dispose()

$g.DrawString("MARINE ENGINEERING  ·  LOCAL-FIRST AI  ·  FIELD TOOLS", $fontMeta, $muted, 80, 486)
$g.DrawString("thanhmarine.viettest.io.vn", $fontUrl, $ink, 78, 514)
$g.DrawString("FIG. 01", $fontFig, $signal, 1038, 84)

# Compass
$cx = 908; $cy = 300; $r = 148
$ringPen = New-Pen "#c6beab" 1.8
$g.DrawEllipse($ringPen, $cx - $r, $cy - $r, $r * 2, $r * 2)
$ringPen.Dispose()

$dashPen = New-Pen "#c6beab" 1 "Dash"
$g.DrawEllipse($dashPen, $cx - 108, $cy - 108, 216, 216)
$dashPen.Dispose()

$tickPen = New-Pen "#687b85" 1.2
for ($i = 0; $i -lt 36; $i++) {
  $angle = ($i * 10) * [Math]::PI / 180
  $inner = if ($i % 9 -eq 0) { $r - 16 } else { $r - 8 }
  $x1 = $cx + [Math]::Cos($angle) * $inner
  $y1 = $cy + [Math]::Sin($angle) * $inner
  $x2 = $cx + [Math]::Cos($angle) * $r
  $y2 = $cy + [Math]::Sin($angle) * $r
  $g.DrawLine($tickPen, [float]$x1, [float]$y1, [float]$x2, [float]$y2)
}
$tickPen.Dispose()

function Draw-CenteredText($graphics, [string]$text, $font, $brush, [float]$x, [float]$y) {
  $size = $graphics.MeasureString($text, $font)
  $graphics.DrawString($text, $font, $brush, $x - $size.Width / 2, $y - $size.Height / 2)
}

Draw-CenteredText $g "N" $fontCompass $ink $cx ($cy - $r - 26)
Draw-CenteredText $g "S" $fontCompass $ink $cx ($cy + $r + 26)
Draw-CenteredText $g "W" $fontCompass $ink ($cx - $r - 28) $cy
Draw-CenteredText $g "E" $fontCompass $ink ($cx + $r + 28) $cy

$needle = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new($cx, $cy - 96),
  [System.Drawing.PointF]::new($cx + 34, $cy),
  [System.Drawing.PointF]::new($cx, $cy + 96),
  [System.Drawing.PointF]::new($cx - 34, $cy)
)
$g.FillPolygon($ink, $needle)
$accentHalf = [System.Drawing.PointF[]]@(
  [System.Drawing.PointF]::new($cx, $cy - 96),
  [System.Drawing.PointF]::new($cx + 34, $cy),
  [System.Drawing.PointF]::new($cx, $cy)
)
$g.FillPolygon($signal, $accentHalf)
$g.FillEllipse($paper, $cx - 7, $cy - 7, 14, 14)
$hubPen = New-Pen "#0c1b26" 1.6
$g.DrawEllipse($hubPen, $cx - 7, $cy - 7, 14, 14)
$hubPen.Dispose()

Draw-CenteredText $g "10°46′N 106°42′E" $fontCoord $muted $cx 514

Save-Png $og (Join-Path $assets "og-image.png")

# ---------------------------------------------------------
# Icons
# ---------------------------------------------------------

function New-CompassIcon([int]$size, [string]$path) {
  $bmp = [System.Drawing.Bitmap]::new($size, $size)
  $gr = [System.Drawing.Graphics]::FromImage($bmp)
  $gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gr.Clear((C "#0c1b26"))

  $cx = $size / 2
  $cy = $size / 2
  $r = $size * 0.30

  $ring = New-Pen "#67d8cf" ([Math]::Max(1.2, $size / 128))
  $ring.Color = [System.Drawing.Color]::FromArgb(150, 103, 216, 207)
  $gr.DrawEllipse($ring, $cx - $r, $cy - $r, $r * 2, $r * 2)
  $ring.Dispose()

  $n = $size * 0.21
  $w = $size * 0.072
  $needle = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($cx, $cy - $n),
    [System.Drawing.PointF]::new($cx + $w, $cy),
    [System.Drawing.PointF]::new($cx, $cy + $n),
    [System.Drawing.PointF]::new($cx - $w, $cy)
  )
  $cream = New-Object System.Drawing.SolidBrush((C "#f7f5ef"))
  $gr.FillPolygon($cream, $needle)

  $half = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($cx, $cy - $n),
    [System.Drawing.PointF]::new($cx + $w, $cy),
    [System.Drawing.PointF]::new($cx, $cy)
  )
  $orange = New-Object System.Drawing.SolidBrush((C "#b9541f"))
  $gr.FillPolygon($orange, $half)

  $hub = $size * 0.028
  $gr.FillEllipse($cream, $cx - $hub, $cy - $hub, $hub * 2, $hub * 2)
  $hubPen = New-Pen "#0c1b26" ([Math]::Max(1, $size / 180))
  $gr.DrawEllipse($hubPen, $cx - $hub, $cy - $hub, $hub * 2, $hub * 2)
  $hubPen.Dispose()

  $cream.Dispose()
  $orange.Dispose()
  $gr.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

New-CompassIcon 512 (Join-Path $assets "icon-512.png")
New-CompassIcon 192 (Join-Path $assets "icon-192.png")
New-CompassIcon 180 (Join-Path $assets "apple-touch-icon.png")

Write-Host "Assets written to $assets"
