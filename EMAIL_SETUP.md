# Email Configuration Guide

## Gmail Setup (Recommended)

### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the prompts to enable 2-Step Verification

### Step 2: Create App Password
1. Go to https://myaccount.google.com/apppasswords
2. In the "App name" field, type "Incentive Card System"
3. Click "Create"
4. Google will generate a 16-character password
5. **Copy this password** (you won't be able to see it again)

### Step 3: Update .env File

In your `backend/.env` file, add:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Important Notes:**
- Use the 16-character App Password (not your regular Gmail password)
- The App Password will have spaces - you can include them or remove them
- Example: `abcd efgh ijkl mnop` or `abcdefghijklmnop`

## Outlook/Hotmail Setup

### Step 1: Enable Basic Authentication
1. Go to https://account.microsoft.com/security
2. Under "Additional security options", enable "App passwords"
3. Create a new app password for "Mail"

### Step 2: Update .env File

```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
```

## Testing Email Configuration

### Local Testing
1. Start the backend server: `cd backend && node index.js`
2. Check the console for email configuration status:
   - ✅ Email service verified = Working
   - ❌ Email service verification failed = Check credentials

### Common Issues

#### Authentication Failed (EAUTH)
**Problem:** Wrong email or password
**Solution:** 
- For Gmail: Make sure you're using the App Password, not your regular password
- Verify EMAIL_USER and EMAIL_PASSWORD in .env file

#### Connection Timeout
**Problem:** Firewall or network blocking SMTP
**Solution:**
- Check your firewall settings
- Try using port 465 instead of 587

#### Gmail "Less Secure Apps"
**Problem:** Gmail blocked the login
**Solution:**
- Don't use "Less secure apps" - use App Passwords instead
- App Passwords are more secure and work better

## Vercel Deployment

When deploying to Vercel, add these environment variables:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add:
   - `EMAIL_USER` = your-gmail@gmail.com
   - `EMAIL_PASSWORD` = your-app-password
4. Click "Save"
5. Redeploy your application

## Testing After Setup

### Test Verification Email
1. Go to the student registration page
2. Enter an email address
3. Click "Send Verification Code"
4. Check the email inbox (including spam folder)

### Test Password Reset
1. Go to "Forgot Password" page
2. Enter your email
3. Check email for reset link

## Troubleshooting

If emails are still not sending:

1. **Check Backend Logs**
   - Look for email configuration messages when server starts
   - Check for error messages when sending emails

2. **Verify Environment Variables**
   ```bash
   # In backend directory
   cat .env | grep EMAIL
   ```

3. **Test Email Manually**
   - Try logging into your email account from a browser
   - Make sure the account is not locked or suspended

4. **Gmail Security Check**
   - Visit https://myaccount.google.com/notifications
   - Check if Google blocked any sign-in attempts

## Support

If you continue to have issues:
1. Check the backend server console for detailed error messages
2. Verify your App Password is correct (try creating a new one)
3. Make sure 2-Step Verification is enabled for Gmail
4. Try using a different email provider (Outlook) if Gmail doesn't work
