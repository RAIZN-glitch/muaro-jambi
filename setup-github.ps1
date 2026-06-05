$proj = "D:\ambatucode python\candi-project-a06e58d26d8d73ce3fd3b0bbea2d6cc06aee7e78\MuaroJambi_Web"
$logFile = "$proj\setup-github-log.txt"

function Log($msg) {
    Write-Host $msg
    Add-Content -Path $logFile -Value $msg
}

Set-Location $proj

"" | Out-File $logFile  # clear/create log

Log "============================================"
Log " Setup GitHub - Ensiklopedia Candi Muaro Jambi"
Log " $(Get-Date)"
Log "============================================"
Log ""

Log "[1/4] git init..."
$r = git init 2>&1; Log "$r"
$r = git branch -M main 2>&1; Log "$r"

Log "[2/4] git add..."
$r = git add . 2>&1; Log "$r"

Log "[3/4] git commit..."
$r = git commit -m "Initial commit: Ensiklopedia Candi Muaro Jambi (KCBN)" 2>&1; Log "$r"

Log "[4/4] Cek GitHub CLI..."
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Log "Menggunakan GitHub CLI..."
    $r = gh repo create muarojambi-web --public --source=. --remote=origin --push 2>&1; Log "$r"
    Log ""
    Log "SELESAI! Cek repo di github.com"
} else {
    Log ""
    Log "GitHub CLI tidak ditemukan."
    Log "Jalankan perintah ini di terminal (VS Code terminal sudah ada git):"
    Log "  git remote add origin https://github.com/USERNAME_KAMU/muarojambi-web.git"
    Log "  git push -u origin main"
    Log ""
    Log "Ganti USERNAME_KAMU dengan username GitHub kamu."
    Log "Pastikan repo 'muarojambi-web' sudah dibuat di github.com terlebih dahulu."
}

Log ""
Log "Selesai. Cek file setup-github-log.txt untuk hasil lengkap."
