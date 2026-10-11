$ErrorActionPreference = 'Stop'

$secureConnection = Read-Host 'Paste the NEW direct Neon connection string' -AsSecureString
$connectionPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureConnection)

try {
    $env:DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($connectionPointer)
    npm run db:migrate

    if ($LASTEXITCODE -ne 0) {
        throw "Database migration failed with exit code $LASTEXITCODE."
    }

    npm run db:verify

    if ($LASTEXITCODE -ne 0) {
        throw "Database verification failed with exit code $LASTEXITCODE."
    }
}
finally {
    if ($connectionPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($connectionPointer)
    }

    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Variable secureConnection -ErrorAction SilentlyContinue
    Remove-Variable connectionPointer -ErrorAction SilentlyContinue
}
