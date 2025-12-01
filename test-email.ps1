# Email Test Script for Student Incentive Card System
# Run this to test if your email is working

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  EMAIL CONFIGURATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Prompt for email address
$testEmail = Read-Host "Enter your email address to receive a test email"

if (-not $testEmail) {
    Write-Host "`n❌ Error: Email address is required" -ForegroundColor Red
    exit
}

Write-Host "`n📧 Sending test email to: $testEmail" -ForegroundColor Yellow
Write-Host "Please wait...`n"

# Test local server first
$localUrl = "http://localhost:3000/api/test-email"
$productionUrl = "https://incentive-card-backend.vercel.app/api/test-email"

$body = @{
    to = $testEmail
} | ConvertTo-Json

# Try local server first
try {
    Write-Host "Testing local server (localhost:3000)..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $localUrl -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "`n✅ SUCCESS! Test email sent from local server" -ForegroundColor Green
    Write-Host "   From: $($response.from)" -ForegroundColor Gray
    Write-Host "   To: $($response.sentTo)" -ForegroundColor Gray
    Write-Host "`nCheck your inbox (and spam folder) for the test email.`n" -ForegroundColor Green
    exit
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 503) {
        Write-Host "`n⚠️  Local server is running but email is NOT configured" -ForegroundColor Yellow
        Write-Host "`nPlease configure your .env file with:" -ForegroundColor Yellow
        Write-Host "  EMAIL_USER=your-email@gmail.com" -ForegroundColor White
        Write-Host "  EMAIL_PASSWORD=your-app-password`n" -ForegroundColor White
        Write-Host "For Gmail App Password instructions, see:" -ForegroundColor Yellow
        Write-Host "  https://myaccount.google.com/apppasswords`n" -ForegroundColor Cyan
        exit
    } elseif ($null -eq $statusCode) {
        Write-Host "`n⚠️  Local server not running. Trying production...`n" -ForegroundColor Yellow
    } else {
        Write-Host "`n❌ Local server error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Try production server
try {
    Write-Host "Testing production server (Vercel)..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $productionUrl -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "`n✅ SUCCESS! Test email sent from production server" -ForegroundColor Green
    Write-Host "   From: $($response.from)" -ForegroundColor Gray
    Write-Host "   To: $($response.sentTo)" -ForegroundColor Gray
    Write-Host "`nCheck your inbox (and spam folder) for the test email.`n" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 503) {
        Write-Host "`n⚠️  Production server is running but email is NOT configured" -ForegroundColor Yellow
        Write-Host "`nPlease configure your Vercel environment variables:" -ForegroundColor Yellow
        Write-Host "  1. Go to your Vercel project settings" -ForegroundColor White
        Write-Host "  2. Navigate to Environment Variables" -ForegroundColor White
        Write-Host "  3. Add EMAIL_USER and EMAIL_PASSWORD" -ForegroundColor White
        Write-Host "  4. Redeploy the backend`n" -ForegroundColor White
    } elseif ($null -eq $statusCode) {
        Write-Host "`n❌ Both local and production servers are unreachable" -ForegroundColor Red
        Write-Host "   Please start your local server or check Vercel deployment`n" -ForegroundColor Red
    } else {
        Write-Host "`n❌ Production server error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
}

Write-Host "========================================`n" -ForegroundColor Cyan
