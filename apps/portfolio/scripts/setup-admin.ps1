$ErrorActionPreference = "Stop"

$ownerEmail = (Read-Host "Owner email").Trim().ToLowerInvariant()
if ($ownerEmail -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$') {
  throw "Enter a valid email address."
}

$env:LOCAL_ADMIN_EMAIL = $ownerEmail
try {
  node ./scripts/configure-local-auth.mjs
} finally {
  Remove-Item Env:LOCAL_ADMIN_EMAIL -ErrorAction SilentlyContinue
}

npm run db:migrate:local
if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }

$firstSecure = Read-Host "Create an owner password (12+ characters)" -AsSecureString
$secondSecure = Read-Host "Confirm the owner password" -AsSecureString
$firstPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($firstSecure)
$secondPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secondSecure)
try {
  $first = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPointer)
  $second = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPointer)
  if ($first.Length -lt 12) { throw "The password must contain at least 12 characters." }
  if ($first -ne $second) { throw "The passwords do not match." }
  $env:ADMIN_BOOTSTRAP_PASSWORD = $first
  node --env-file=.env --import tsx ./scripts/bootstrap-admin.ts
  if ($LASTEXITCODE -ne 0) { throw "Owner initialization failed." }
} finally {
  Remove-Item Env:ADMIN_BOOTSTRAP_PASSWORD -ErrorAction SilentlyContinue
  if ($firstPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPointer) }
  if ($secondPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPointer) }
  $first = $null
  $second = $null
}

Write-Host "Setup complete. Start the site and open http://127.0.0.1:8787/admin/login"
