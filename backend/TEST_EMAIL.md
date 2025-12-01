# Email Testing Guide

## Quick Test

To test if your email is configured correctly, use this endpoint:

### Test Email Endpoint
```bash
POST /api/test-email
```

**Request Body:**
```json
{
  "to": "your-test-email@gmail.com"
}
```

### Using PowerShell:
```powershell
$body = @{
    to = "your-email@gmail.com"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/test-email" -Method POST -Body $body -ContentType "application/json"
```

### Using curl:
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@gmail.com"}'
```

## Check Email Configuration

The server logs will show:
- ✅ Email configured and ready
- ❌ Email not configured

Look for these messages when the server starts:

```
📧 Email Configuration Check:
   EMAIL_USER exists: true
   EMAIL_USER value: you***@gmail.com
   EMAIL_PASSWORD exists: true
   EMAIL_PASSWORD length: 16
   Detected Gmail account
✅ Email transporter created
✅ Email service verified and ready to send messages
```

## Common Issues

### 1. Gmail Authentication Failed
**Problem:** EAUTH error when sending

**Solution:**
1. Enable 2-Step Verification on your Google Account
2. Go to https://myaccount.google.com/apppasswords
3. Create an App Password
4. Use the 16-character App Password (no spaces) in EMAIL_PASSWORD

### 2. Email Not Configured
**Problem:** Logs show "Email not configured"

**Solution:**
Check your `.env` file has:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### 3. Outlook/Hotmail Issues
**Problem:** Emails not sending from Outlook

**Solution:**
1. Enable "Let apps that use basic auth to access data" in account settings
2. Or use an App Password

## Testing Registration Email

1. Register a new student
2. Check server logs for:
   ```
   📧 Attempting to send welcome email...
   Email configured: true
   Transporter exists: true
   Sending welcome email to: student@example.com
   ✅ Welcome email sent successfully to: student@example.com
   ```

3. If you see errors, they'll appear with details:
   ```
   ❌ Failed to send welcome email:
      Error code: EAUTH
      Error message: Invalid login: 535-5.7.8 Username and Password not accepted
   ```

## Testing Forgot Password

1. Request password reset
2. Check server logs for:
   ```
   🔐 FORGOT PASSWORD REQUEST
   ============================================================
   Email: student@example.com
   Email configured: true
   Transporter exists: true
   ============================================================
   ```

3. Should see:
   ```
   ✅ Password reset email sent successfully
   ```

## Verifying Email in Production (Vercel)

Make sure these environment variables are set in Vercel:
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - `EMAIL_USER` = your-email@gmail.com
   - `EMAIL_PASSWORD` = your-app-password
4. Redeploy the backend

## Need Help?

If emails still aren't sending:
1. Run the test email endpoint first
2. Check the server console for detailed error messages
3. Verify your email credentials are correct
4. Make sure you're using an App Password, not your regular password
5. Check spam/junk folder for test emails
