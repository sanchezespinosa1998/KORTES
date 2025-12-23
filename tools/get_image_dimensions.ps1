$images = Get-ChildItem "portaoflio\*.webp"
foreach ($img in $images) {
    try {
        $image = [System.Drawing.Image]::FromFile($img.FullName)
        Write-Host "$($img.Name): $($image.Width)x$($image.Height)"
        $image.Dispose()
    } catch {
        Write-Host "$($img.Name): Error al leer"
    }
}

