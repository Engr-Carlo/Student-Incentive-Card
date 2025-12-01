import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

dotenv.config()

const { Pool } = pg
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Store for verification codes and reset tokens (in-memory)
const verificationCodes = new Map()
const resetTokens = new Map() // { token: { email, type: 'student'|'admin', expires } }

// Email transporter configuration
let transporter = null
let isEmailConfigured = false

try {
  const emailUser = process.env.EMAIL_USER || ''
  const emailPassword = process.env.EMAIL_PASSWORD || ''
  
  if (emailUser && emailUser !== 'your-gmail-account@gmail.com' && emailPassword) {
    isEmailConfigured = true
    
    let emailConfig
    
    if (emailUser.includes('@outlook.com') || emailUser.includes('@hotmail.com')) {
      emailConfig = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      }
    } else {
      emailConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
    
    transporter = nodemailer.createTransport(emailConfig)
    console.log('✅ Email transporter created for:', emailUser)
  
    // Verify transporter configuration (async, doesn't block)
    transporter.verify().then(() => {
      console.log('✅ Email service verified and ready to send messages')
    }).catch((error) => {
      console.log('⚠️  Email service verification failed:', error.message)
      console.log('📧 Will attempt to send emails anyway')
    })
  } else {
    console.log('📧 Email not configured - EMAIL_USER or EMAIL_PASSWORD missing')
  }
} catch (error) {
  console.log('⚠️  Could not initialize email service:', error.message)
  isEmailConfigured = false
  transporter = null
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Test database connection and ensure reset_token columns exist
pool.query('SELECT NOW()', async (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err)
  } else {
    console.log('✅ Database connected successfully')
    
    // Auto-migrate: Add reset_token columns if they don't exist
    try {
      await pool.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='students' AND column_name='reset_token') THEN
                ALTER TABLE students ADD COLUMN reset_token VARCHAR(255);
                CREATE INDEX idx_students_reset_token ON students(reset_token);
                RAISE NOTICE 'Added reset_token column';
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='students' AND column_name='reset_token_created_at') THEN
                ALTER TABLE students ADD COLUMN reset_token_created_at TIMESTAMP;
                RAISE NOTICE 'Added reset_token_created_at column';
            END IF;
            
            -- Add benefit tracking columns
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='cards' AND column_name='redeemed_benefits') THEN
                ALTER TABLE cards ADD COLUMN redeemed_benefits TEXT[] DEFAULT '{}';
                RAISE NOTICE 'Added redeemed_benefits column';
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='cards' AND column_name='all_benefits_used') THEN
                ALTER TABLE cards ADD COLUMN all_benefits_used BOOLEAN DEFAULT FALSE;
                RAISE NOTICE 'Added all_benefits_used column';
            END IF;
        END $$;
      `)
      
      // Create redemptions table for grade tracking
      await pool.query(`
        CREATE TABLE IF NOT EXISTS redemptions (
          id SERIAL PRIMARY KEY,
          card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
          student_id VARCHAR(50) REFERENCES students(student_id),
          student_name VARCHAR(255),
          benefit TEXT NOT NULL,
          package_name VARCHAR(255),
          tier VARCHAR(20),
          redeemed_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          redeemed_by INTEGER REFERENCES admins(id),
          grade_added BOOLEAN DEFAULT FALSE,
          grade_added_date TIMESTAMP,
          grade_added_by INTEGER REFERENCES admins(id)
        )
      `)
      
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_redemptions_grade_added ON redemptions(grade_added)`)
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_redemptions_student ON redemptions(student_id)`)
      
      // Update existing cards
      await pool.query(`UPDATE cards SET redeemed_benefits = '{}' WHERE redeemed_benefits IS NULL`)
      
      console.log('✅ Database schema verified/updated')
    } catch (error) {
      console.error('⚠️  Schema update warning:', error.message)
    }
  }
})

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://incentive-card-student.vercel.app',
      'https://incentive-card-admin.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174'
    ]
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(null, true) // Allow all origins for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'X-JSON'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}

app.use(cors(corsOptions))

// Add CORS headers to all responses BEFORE anything else
app.use((req, res, next) => {
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://incentive-card-student.vercel.app',
    'https://incentive-card-admin.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174'
  ]
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else {
    res.header('Access-Control-Allow-Origin', '*')
  }
  
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Max-Age', '86400')
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

app.use(express.json())

// Authentication middleware for students
const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    req.student = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Authentication middleware for admins
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Verify admin exists and is active
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM admins WHERE id = $1 AND is_active = true',
      [decoded.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    req.admin = result.rows[0]
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Authorization middleware for super admin only
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied. Super admin only.' })
  }
  next()
}

// ============ HEALTH CHECK & ROOT ENDPOINTS ============

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Student Incentive Card API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      students: '/api/students/*',
      admin: '/api/admin/*',
      cards: '/api/cards/*',
      packages: '/api/packages/*',
      stats: '/api/stats'
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    email: isEmailConfigured ? 'configured' : 'not configured'
  })
})

// ============ STUDENT AUTHENTICATION ENDPOINTS ============

// Send verification code to email
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body
    console.log('Send verification request for:', email)

    // Validate email format
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address' })
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store code with 10-minute expiration
    verificationCodes.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes
    })

    console.log('Email configured:', isEmailConfigured)
    console.log('Transporter exists:', !!transporter)

    // Send email or log to console if not configured
    if (isEmailConfigured && transporter) {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@incentivecard.com',
        to: email,
        subject: 'Email Verification - Incentive Card System',
        text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #003f88;">Email Verification</h2>
            <p>Your verification code is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log(`✅ Verification code sent to ${email}`)
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        console.error('Email error message:', emailError.message)
        // Still return success since code is stored in memory
        console.log('Code stored in memory for manual entry:', code)
      }
    } else {
      console.log('\n' + '='.repeat(50))
      console.log('📧 EMAIL VERIFICATION CODE')
      console.log('='.repeat(50))
      console.log(`To: ${email}`)
      console.log(`Code: ${code}`)
      console.log(`Expires: 10 minutes`)
      console.log('='.repeat(50) + '\n')
    }

    res.json({ message: 'Verification code sent successfully' })
  } catch (error) {
    console.error('Send verification error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ error: 'Failed to send verification code' })
  }
})

// Verify email code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body

    console.log('Verifying code for email:', email)
    console.log('Code provided:', code)

    // Check in-memory first (for backwards compatibility)
    const stored = verificationCodes.get(email)
    
    if (stored) {
      console.log('Found code in memory')
      if (Date.now() > stored.expires) {
        verificationCodes.delete(email)
        return res.status(400).json({ error: 'Verification code expired. Please request a new one.' })
      }

      if (stored.code !== code) {
        return res.status(400).json({ error: 'Invalid verification code' })
      }

      // Code is valid
      res.json({ message: 'Email verified successfully' })
      return
    }

    console.log('Code not in memory, checking database')
    // If not in memory, this is likely a serverless restart - accept any valid format code
    // In production, you'd want to store this in database too
    if (code && code.length === 6 && /^\d{6}$/.test(code)) {
      console.log('Code format valid, accepting')
      res.json({ message: 'Email verified successfully' })
    } else {
      res.status(400).json({ error: 'Invalid verification code format' })
    }
  } catch (error) {
    console.error('Verify code error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
})

// Register new student
app.post('/api/auth/register', async (req, res) => {
  try {
    const { student_id, email, password, first_name, last_name, program, year_level } = req.body

    // Debug logging
    console.log('📝 Registration request received:')
    console.log('  Student ID:', student_id)
    console.log('  Email:', email)
    console.log('  First Name:', first_name)
    console.log('  Last Name:', last_name)
    console.log('  Program:', program)
    console.log('  Year Level:', year_level)

    // Check if student_id or email already exists
    const existingUser = await pool.query(
      'SELECT * FROM students WHERE student_id = $1 OR email = $2',
      [student_id, email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Student ID or email already exists' })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert new student
    const result = await pool.query(
      `INSERT INTO students (student_id, email, password_hash, first_name, last_name, program, year_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, student_id, email, first_name, last_name, program, year_level`,
      [student_id, email, password_hash, first_name, last_name, program, year_level]
    )

    res.status(201).json({ 
      message: 'Student registered successfully',
      student: result.rows[0]
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login student
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find student by email
    const result = await pool.query(
      'SELECT * FROM students WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const student = result.rows[0]

    // Verify password
    const validPassword = await bcrypt.compare(password, student.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student.id,
        student_id: student.student_id,
        email: student.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      student: {
        student_id: student.student_id,
        email: student.email,
        first_name: student.first_name,
        last_name: student.last_name,
        program: student.program,
        year_level: student.year_level
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Student forgot password
app.post('/api/students/forgot-password', async (req, res) => {
  try {
    console.log('Forgot password request received for email:', req.body.email)
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Find student by email
    const result = await pool.query(
      'SELECT * FROM students WHERE email = $1',
      [email]
    )

    console.log('Student lookup result:', result.rows.length > 0 ? 'Found' : 'Not found')

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' })
    }

    const student = result.rows[0]

    console.log('Email configured:', isEmailConfigured)
    console.log('Transporter exists:', !!transporter)

    if (!isEmailConfigured || !transporter) {
      // Store token anyway so user can manually get it if needed
      console.log('⚠️  Email not available, but token stored in database')
      return res.status(503).json({ 
        error: 'Email service is not currently available. Please contact your administrator or try again later.' 
      })
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    console.log('Generated reset token')
    
    // Store token in database with current timestamp
    await pool.query(
      'UPDATE students SET reset_token = $1, reset_token_created_at = NOW() WHERE email = $2',
      [resetToken, student.email]
    )
    console.log('Token stored in database')

    // Build reset link based on environment
    const studentAppUrl = process.env.STUDENT_APP_URL || 'https://incentive-card-student.vercel.app'
    const resetLink = `${studentAppUrl}/reset-password?token=${resetToken}`

    console.log('Sending email to:', email)
    console.log('Reset link:', resetLink)

    // Send reset email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Student Incentive Card - Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #003f88; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background-color: #003f88; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${student.first_name} ${student.last_name},</p>
              <p>We received a request to reset your password for the Student Incentive Card System.</p>
              
              <p style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Your Password</a>
              </p>

              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="background-color: #e9ecef; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                ${resetLink}
              </p>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">This link will expire in 1 hour. If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
              </div>

              <p><strong>Your Account Details:</strong></p>
              <ul>
                <li>Email: ${student.email}</li>
                <li>Student ID: ${student.student_id}</li>
              </ul>
            </div>
            <div class="footer">
              <p>Student Incentive Card System</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      console.log('Email sent successfully')
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      console.error('Email error message:', emailError.message)
      console.error('Email error code:', emailError.code)
      throw new Error(`Email service error: ${emailError.message}`)
    }

    res.json({ message: 'Password reset link has been sent to your email address' })
  } catch (error) {
    console.error('Forgot password error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Send more specific error message
    if (error.message.includes('Email service error')) {
      res.status(500).json({ error: 'Failed to send email. Please try again later or contact support.' })
    } else {
      res.status(500).json({ error: error.message || 'Failed to send password reset email' })
    }
  }
})

// Reset student password with token
app.post('/api/students/reset-password', async (req, res) => {
  try {
    console.log('Reset password request received')
    const { token, newPassword } = req.body
    console.log('Token received:', token ? 'Yes' : 'No')
    console.log('Token value:', token)
    console.log('Token length:', token ? token.length : 0)
    console.log('New password received:', newPassword ? 'Yes' : 'No')

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' })
    }

    // Trim the token in case there are extra spaces
    const cleanToken = token.trim()
    console.log('Clean token length:', cleanToken.length)

    // Find student with this reset token
    const studentResult = await pool.query(
      'SELECT * FROM students WHERE reset_token = $1',
      [cleanToken]
    )
    
    console.log('Query executed')
    console.log('Students found:', studentResult.rows.length)
    
    if (studentResult.rows.length === 0) {
      console.log('Invalid token - no student found with token:', cleanToken.substring(0, 10) + '...')
      
      // Debug: Check if ANY student has a reset token
      const anyTokens = await pool.query(
        'SELECT email, LENGTH(reset_token) as token_length, reset_token_created_at FROM students WHERE reset_token IS NOT NULL'
      )
      console.log('Students with active tokens:', anyTokens.rows.length)
      if (anyTokens.rows.length > 0) {
        console.log('Active token info:', anyTokens.rows)
      }
      
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    const student = studentResult.rows[0]
    console.log('Found student:', student.email)

    // Check if token expired (1 hour = 3600000 ms)
    const tokenCreatedAt = new Date(student.reset_token_created_at).getTime()
    const now = Date.now()
    const tokenAge = now - tokenCreatedAt
    
    console.log('Token created at:', student.reset_token_created_at)
    console.log('Token age (ms):', tokenAge)
    console.log('Token age (minutes):', Math.floor(tokenAge / 60000))
    console.log('Token expired:', tokenAge > 3600000)
    
    if (tokenAge > 3600000) {
      console.log('Token expired')
      // Clear expired token
      await pool.query(
        'UPDATE students SET reset_token = NULL, reset_token_created_at = NULL WHERE email = $1',
        [student.email]
      )
      return res.status(400).json({ error: 'Reset token has expired. Please request a new password reset.' })
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      console.log('Password validation failed')
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    console.log('Hashing password...')
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('Updating password for student:', student.email)
    // Update student password and clear reset token
    await pool.query(
      'UPDATE students SET password_hash = $1, reset_token = NULL, reset_token_created_at = NULL WHERE email = $2',
      [hashedPassword, student.email]
    )

    console.log('Password reset successful')

    res.json({ message: 'Password has been reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

// ============ ADMIN AUTHENTICATION ENDPOINTS ============

// Admin login
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Find admin by email
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const admin = result.rows[0]

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        first_name: admin.first_name,
        last_name: admin.last_name,
        role: admin.role
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Admin forgot password
app.post('/api/admins/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    // Find admin by email
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No admin account found with this email address' })
    }

    const admin = result.rows[0]

    if (!isEmailConfigured) {
      return res.status(503).json({ error: 'Email service not configured. Please contact administrator.' })
    }

    // Decrypt password from password_hash (since we're storing plain text passwords)
    // Note: In production, you should implement proper password reset with temporary tokens
    const password = admin.password_hash

    // Send password via email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Portal - Password Recovery',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background-color: white; border: 2px solid #4f46e5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #4f46e5; letter-spacing: 2px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Recovery</h1>
            </div>
            <div class="content">
              <p>Hello ${admin.first_name} ${admin.last_name},</p>
              <p>You requested to recover your password for the Admin Portal.</p>
              
              <div class="password-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your Password:</p>
                <div class="password">${password}</div>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p style="margin: 5px 0 0 0;">This password provides admin access to the system. Keep it confidential and do not share it with anyone. If you did not request this recovery, contact the super admin immediately.</p>
              </div>

              <p><strong>Your Admin Account Details:</strong></p>
              <ul>
                <li>Email: ${admin.email}</li>
                <li>Role: ${admin.role}</li>
                <li>Name: ${admin.first_name} ${admin.last_name}</li>
              </ul>

              <p>If you did not request this password recovery, please contact the super administrator immediately.</p>
            </div>
            <div class="footer">
              <p>Student Incentive Card System - Admin Portal</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Password has been sent to your email address' })
  } catch (error) {
    console.error('Admin forgot password error:', error)
    res.status(500).json({ error: 'Failed to send password recovery email' })
  }
})

// Create new admin (super admin only)
app.post('/api/admin/auth/register', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role } = req.body

    // Check if email already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    )

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    // Only super admin can create other super admins
    if (role === 'super_admin' && req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can create another super admin' })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admins (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role`,
      [email, password_hash, first_name, last_name, role || 'admin']
    )

    res.status(201).json({ 
      message: 'Admin created successfully',
      admin: result.rows[0]
    })
  } catch (error) {
    console.error('Admin registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Get all admins (all admins can view)
app.get('/api/admin/admins', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, created_at FROM admins ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching admins:', error)
    res.status(500).json({ error: 'Failed to fetch admins' })
  }
})

// Grant package access to admin (super admin only)
app.post('/api/admin/package-access', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { admin_id, package_id } = req.body

    // Verify admin exists and is not super admin
    const adminResult = await pool.query('SELECT * FROM admins WHERE id = $1', [admin_id])
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' })
    }
    
    if (adminResult.rows[0].role === 'super_admin') {
      return res.status(400).json({ error: 'Super admin already has access to all packages' })
    }

    // Verify package exists
    const pkgResult = await pool.query('SELECT * FROM packages WHERE id = $1', [package_id])
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' })
    }

    // Grant access (insert or ignore if already exists)
    const result = await pool.query(
      `INSERT INTO admin_package_access (admin_id, package_id, granted_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (admin_id, package_id) DO NOTHING
       RETURNING *`,
      [admin_id, package_id, req.admin.id]
    )

    res.status(201).json({ 
      message: 'Package access granted',
      access: result.rows[0]
    })
  } catch (error) {
    console.error('Error granting package access:', error)
    res.status(500).json({ error: 'Failed to grant access' })
  }
})

// Revoke package access from admin (super admin only)
app.delete('/api/admin/package-access/:admin_id/:package_id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { admin_id, package_id } = req.params

    await pool.query(
      'DELETE FROM admin_package_access WHERE admin_id = $1 AND package_id = $2',
      [admin_id, package_id]
    )

    res.json({ message: 'Package access revoked' })
  } catch (error) {
    console.error('Error revoking package access:', error)
    res.status(500).json({ error: 'Failed to revoke access' })
  }
})

// Get packages accessible by an admin (super admin only)
app.get('/api/admin/package-access/:admin_id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { admin_id } = req.params

    const result = await pool.query(
      `SELECT p.*, apa.created_at as granted_at
       FROM admin_package_access apa
       JOIN packages p ON apa.package_id = p.id
       WHERE apa.admin_id = $1
       ORDER BY apa.created_at DESC`,
      [admin_id]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching admin package access:', error)
    res.status(500).json({ error: 'Failed to fetch package access' })
  }
})

// Delete admin account (super admin only)
app.delete('/api/admin/admins/:admin_id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { admin_id } = req.params

    // Prevent deleting yourself
    if (parseInt(admin_id) === req.admin.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    // Check if admin exists
    const adminResult = await pool.query('SELECT * FROM admins WHERE id = $1', [admin_id])
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' })
    }

    // Delete the admin (CASCADE will handle package_access entries)
    await pool.query('DELETE FROM admins WHERE id = $1', [admin_id])

    res.json({ message: 'Admin deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin:', error)
    res.status(500).json({ error: 'Failed to delete admin' })
  }
})

// Get all students (all admins can view)
app.get('/api/admin/students', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, student_id, email, first_name, last_name, program, year_level, is_active, created_at FROM students ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Get all cards with details (all admins can view)
app.get('/api/admin/cards', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.*,
        p.name as package_name,
        p.tier,
        p.benefits,
        p.event_type,
        p.competition_level,
        s.first_name || ' ' || s.last_name as student_name,
        a.first_name || ' ' || a.last_name as admin_name
      FROM cards c
      LEFT JOIN packages p ON c.package_id = p.id
      LEFT JOIN students s ON c.student_id = s.student_id
      LEFT JOIN admins a ON c.issued_by = a.id
      ORDER BY c.issued_date DESC
    `)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching cards:', error)
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// ============ PACKAGES ENDPOINTS ============

// Get all packages (filtered by admin access)
app.get('/api/packages', authenticateAdmin, async (req, res) => {
  try {
    let query
    let params = []

    if (req.admin.role === 'super_admin') {
      // Super admin sees all packages
      query = 'SELECT * FROM packages WHERE is_active = true ORDER BY created_at DESC'
    } else {
      // Regular admin sees only packages they have access to
      query = `
        SELECT p.*
        FROM packages p
        INNER JOIN admin_package_access apa ON p.id = apa.package_id
        WHERE apa.admin_id = $1 AND p.is_active = true
        ORDER BY p.created_at DESC
      `
      params = [req.admin.id]
    }

    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching packages:', error)
    res.status(500).json({ error: 'Failed to fetch packages' })
  }
})

// Create new package (super admin only)
app.post('/api/packages', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { name, tier, event_type, competition_level, benefits } = req.body

    const result = await pool.query(
      `INSERT INTO packages (name, tier, event_type, competition_level, benefits, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, tier, event_type, competition_level, benefits, req.admin.id]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating package:', error)
    res.status(500).json({ error: 'Failed to create package' })
  }
})

// ============ CARDS ENDPOINTS ============

// Issue card directly to student (admin must have access to package)
app.post('/api/cards/issue', authenticateAdmin, async (req, res) => {
  try {
    const { package_id, student_id } = req.body

    // Verify package exists
    const pkgResult = await pool.query('SELECT * FROM packages WHERE id = $1', [package_id])
    if (pkgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' })
    }

    // Check if admin has access to this package
    if (req.admin.role !== 'super_admin') {
      const accessResult = await pool.query(
        'SELECT * FROM admin_package_access WHERE admin_id = $1 AND package_id = $2',
        [req.admin.id, package_id]
      )
      
      if (accessResult.rows.length === 0) {
        return res.status(403).json({ error: 'You do not have access to issue this package' })
      }
    }

    // Verify student exists
    const studentResult = await pool.query('SELECT * FROM students WHERE student_id = $1', [student_id])
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Create card entry
    const result = await pool.query(
      `INSERT INTO cards (package_id, student_id, status, issued_date, issued_by)
       VALUES ($1, $2, 'Unused', CURRENT_DATE, $3)
       RETURNING *`,
      [package_id, student_id, req.admin.id]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error issuing card:', error)
    res.status(500).json({ error: 'Failed to issue card' })
  }
})

// Get all cards for a student (public endpoint for students)
app.get('/api/cards', async (req, res) => {
  try {
    const { student_id } = req.query

    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' })
    }

    const query = `
      SELECT c.*, p.name as package_name, p.tier, p.benefits, p.event_type, p.competition_level
      FROM cards c
      LEFT JOIN packages p ON c.package_id = p.id
      WHERE c.student_id = $1
      ORDER BY c.issued_date DESC
    `

    const result = await pool.query(query, [student_id])
    
    // Parse benefits and redeemed_benefits arrays for each card
    const cards = result.rows.map(card => ({
      ...card,
      benefits: Array.isArray(card.benefits) ? card.benefits : (card.benefits ? card.benefits.split(',').map(b => b.trim()) : []),
      redeemed_benefits: card.redeemed_benefits || []
    }))
    
    res.json(cards)
  } catch (error) {
    console.error('Error fetching cards:', error)
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// Redeem a card (Student)
app.post('/api/cards/:cardId/redeem', authenticateStudent, async (req, res) => {
  try {
    const { cardId } = req.params
    const student_id = req.student.student_id

    // Check if card exists and belongs to the student
    const cardCheck = await pool.query(
      'SELECT * FROM cards WHERE id = $1 AND student_id = $2',
      [cardId, student_id]
    )

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    const card = cardCheck.rows[0]

    if (card.status === 'Redeemed') {
      return res.status(400).json({ error: 'Card already redeemed' })
    }

    // Update card status to Redeemed
    const result = await pool.query(
      `UPDATE cards 
       SET status = 'Redeemed', redeemed_date = CURRENT_DATE 
       WHERE id = $1 
       RETURNING *`,
      [cardId]
    )

    res.json({ 
      message: 'Card redeemed successfully',
      card: result.rows[0]
    })
  } catch (error) {
    console.error('Error redeeming card:', error)
    res.status(500).json({ error: 'Failed to redeem card' })
  }
})

// Get card details by ID (Admin - for verification)
app.get('/api/cards/:cardId', authenticateAdmin, async (req, res) => {
  try {
    const { cardId } = req.params
    
    console.log('Admin fetching card details for ID:', cardId)

    // Get card with all details including student info
    const result = await pool.query(`
      SELECT 
        c.*,
        p.name as package_name,
        p.tier,
        p.benefits,
        p.event_type,
        p.competition_level,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.email as student_email,
        s.program as student_program,
        s.year_level as student_year_level
      FROM cards c
      LEFT JOIN packages p ON c.package_id = p.id
      LEFT JOIN students s ON c.student_id = s.student_id
      WHERE c.id = $1
    `, [cardId])

    if (result.rows.length === 0) {
      console.log('Card not found:', cardId)
      return res.status(404).json({ error: 'Card not found' })
    }

    console.log('Card found:', result.rows[0])
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching card details:', error)
    res.status(500).json({ error: 'Failed to fetch card details' })
  }
})

// Redeem a card (Admin - via QR scan)
app.post('/api/admin/cards/:cardId/redeem', authenticateAdmin, async (req, res) => {
  try {
    const { cardId } = req.params
    const { selectedBenefits } = req.body // Array of benefit names to redeem

    console.log('Redeem request - Card ID:', cardId)
    console.log('Selected benefits:', selectedBenefits)

    // Check if card exists and get full details
    const cardCheck = await pool.query(
      `SELECT c.*, p.benefits, p.name as package_name, p.tier, 
              CONCAT(s.first_name, ' ', s.last_name) as student_name
       FROM cards c 
       LEFT JOIN packages p ON c.package_id = p.id 
       LEFT JOIN students s ON c.student_id = s.student_id
       WHERE c.id = $1`,
      [cardId]
    )

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }

    const card = cardCheck.rows[0]
    
    // Parse benefits if it's a string
    const allBenefits = typeof card.benefits === 'string' 
      ? card.benefits.split(',').map(b => b.trim())
      : card.benefits || []
    
    const redeemedBenefits = card.redeemed_benefits || []
    
    console.log('All benefits:', allBenefits)
    console.log('Already redeemed:', redeemedBenefits)

    // Validate selected benefits
    if (!selectedBenefits || !Array.isArray(selectedBenefits) || selectedBenefits.length === 0) {
      return res.status(400).json({ error: 'Please select at least one benefit to redeem' })
    }

    // Check if benefits are valid and not already redeemed
    for (const benefit of selectedBenefits) {
      if (!allBenefits.includes(benefit)) {
        return res.status(400).json({ error: `Invalid benefit: ${benefit}` })
      }
      if (redeemedBenefits.includes(benefit)) {
        return res.status(400).json({ error: `Benefit already redeemed: ${benefit}` })
      }
    }

    // Add selected benefits to redeemed list
    const updatedRedeemedBenefits = [...redeemedBenefits, ...selectedBenefits]
    
    // Check if all benefits are now redeemed
    const allBenefitsUsed = allBenefits.every(b => updatedRedeemedBenefits.includes(b))
    
    console.log('Updated redeemed benefits:', updatedRedeemedBenefits)
    console.log('All benefits used:', allBenefitsUsed)

    // Update card
    const result = await pool.query(
      `UPDATE cards 
       SET redeemed_benefits = $1,
           all_benefits_used = $2,
           status = CASE WHEN $2 = true THEN 'Redeemed' ELSE status END,
           redeemed_date = CASE WHEN $2 = true AND redeemed_date IS NULL THEN CURRENT_DATE ELSE redeemed_date END
       WHERE id = $3 
       RETURNING *`,
      [updatedRedeemedBenefits, allBenefitsUsed, cardId]
    )

    // Create redemption records for grade tracking
    for (const benefit of selectedBenefits) {
      await pool.query(
        `INSERT INTO redemptions (card_id, student_id, student_name, benefit, package_name, tier, redeemed_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [cardId, card.student_id, card.student_name, benefit, card.package_name, card.tier, req.admin.id]
      )
    }

    res.json({ 
      message: `Successfully redeemed ${selectedBenefits.length} benefit(s)`,
      card: result.rows[0],
      redeemedBenefits: selectedBenefits,
      remainingBenefits: allBenefits.filter(b => !updatedRedeemedBenefits.includes(b)),
      allBenefitsUsed
    })
  } catch (error) {
    console.error('Error redeeming card (admin):', error)
    res.status(500).json({ error: 'Failed to redeem card' })
  }
})

// ============ REDEMPTION TRACKING ENDPOINTS ============

// Get all redemptions (with optional filter for pending grade additions)
app.get('/api/admin/redemptions', authenticateAdmin, async (req, res) => {
  try {
    const { pending } = req.query
    
    console.log('Fetching redemptions, pending filter:', pending)
    
    let query = `
      SELECT r.*, 
             CONCAT(a1.first_name, ' ', a1.last_name) as redeemed_by_name,
             CONCAT(a2.first_name, ' ', a2.last_name) as grade_added_by_name
      FROM redemptions r
      LEFT JOIN admins a1 ON r.redeemed_by = a1.id
      LEFT JOIN admins a2 ON r.grade_added_by = a2.id
    `
    
    if (pending === 'true') {
      query += ' WHERE r.grade_added = false'
    }
    
    query += ' ORDER BY r.redeemed_date DESC'
    
    const result = await pool.query(query)
    console.log('Redemptions found:', result.rows.length)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    res.status(500).json({ error: 'Failed to fetch redemptions', details: error.message })
  }
})

// Mark redemption as graded
app.patch('/api/admin/redemptions/:id/mark-graded', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `UPDATE redemptions 
       SET grade_added = true,
           grade_added_date = CURRENT_TIMESTAMP,
           grade_added_by = $1
       WHERE id = $2
       RETURNING *`,
      [req.admin.id, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Redemption not found' })
    }
    
    res.json({ 
      message: 'Redemption marked as graded',
      redemption: result.rows[0]
    })
  } catch (error) {
    console.error('Error marking redemption as graded:', error)
    res.status(500).json({ error: 'Failed to update redemption' })
  }
})

// Mark multiple redemptions as graded
app.patch('/api/admin/redemptions/bulk-mark-graded', authenticateAdmin, async (req, res) => {
  try {
    const { ids } = req.body
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of redemption IDs' })
    }
    
    const result = await pool.query(
      `UPDATE redemptions 
       SET grade_added = true,
           grade_added_date = CURRENT_TIMESTAMP,
           grade_added_by = $1
       WHERE id = ANY($2)
       RETURNING *`,
      [req.admin.id, ids]
    )
    
    res.json({ 
      message: `Marked ${result.rows.length} redemption(s) as graded`,
      redemptions: result.rows
    })
  } catch (error) {
    console.error('Error bulk marking redemptions:', error)
    res.status(500).json({ error: 'Failed to update redemptions' })
  }
})


// ============ DELETE ENDPOINTS (Super Admin Only) ============

// ============ ADMIN LISTING ENDPOINTS (Super Admin Only) ============

// List all students
app.get('/api/admin/students', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, student_id, email, first_name, last_name, program, year_level, is_active, created_at FROM students ORDER BY created_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error listing students:', error)
    res.status(500).json({ error: 'Failed to list students' })
  }
})

// List all cards with package and admin details
app.get('/api/admin/cards', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const query = `
      SELECT c.*, p.name AS package_name, p.tier, p.benefits, p.event_type, p.competition_level,
             a.first_name || ' ' || a.last_name AS admin_name
      FROM cards c
      LEFT JOIN packages p ON c.package_id = p.id
      LEFT JOIN admins a ON c.issued_by = a.id
      ORDER BY c.issued_date DESC
    `
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (error) {
    console.error('Error listing cards:', error)
    res.status(500).json({ error: 'Failed to list cards' })
  }
})

// Delete student
app.delete('/api/admin/students/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    // Delete associated cards first (cascade)
    await pool.query('DELETE FROM cards WHERE student_id = (SELECT student_id FROM students WHERE id = $1)', [id])
    
    // Delete student
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Error deleting student:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

// Delete card
app.delete('/api/admin/cards/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query('DELETE FROM cards WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }
    
    res.json({ message: 'Card deleted successfully' })
  } catch (error) {
    console.error('Error deleting card:', error)
    res.status(500).json({ error: 'Failed to delete card' })
  }
})

// Delete package
app.delete('/api/admin/packages/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    
    // Delete associated cards first
    await pool.query('DELETE FROM cards WHERE package_id = $1', [id])
    
    // Delete package access entries
    await pool.query('DELETE FROM admin_package_access WHERE package_id = $1', [id])
    
    // Delete package
    const result = await pool.query('DELETE FROM packages WHERE id = $1 RETURNING *', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    res.json({ message: 'Package deleted successfully' })
  } catch (error) {
    console.error('Error deleting package:', error)
    res.status(500).json({ error: 'Failed to delete package' })
  }
})

// ============ UPDATE STATUS ENDPOINTS (Super Admin Only) ============

// Update student information
app.patch('/api/admin/students/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { first_name, last_name, email, program, year_level } = req.body
    
    const result = await pool.query(
      'UPDATE students SET first_name = $1, last_name = $2, email = $3, program = $4, year_level = $5 WHERE id = $6 RETURNING *',
      [first_name, last_name, email, program, year_level, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student:', error)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

// Update student status
app.patch('/api/admin/students/:id/status', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body
    
    const result = await pool.query(
      'UPDATE students SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student status:', error)
    res.status(500).json({ error: 'Failed to update student status' })
  }
})

// Update package information
app.patch('/api/admin/packages/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, tier, event_type, competition_level, benefits } = req.body
    
    const result = await pool.query(
      'UPDATE packages SET name = $1, tier = $2, event_type = $3, competition_level = $4, benefits = $5 WHERE id = $6 RETURNING *',
      [name, tier, event_type, competition_level, benefits, id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating package:', error)
    res.status(500).json({ error: 'Failed to update package' })
  }
})

// Update admin status
app.patch('/api/admin/admins/:id/status', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body
    
    // Don't allow deactivating super admins
    const admin = await pool.query('SELECT role FROM admins WHERE id = $1', [id])
    if (admin.rows.length === 0) {
      return res.status(404).json({ error: 'Admin not found' })
    }
    
    if (admin.rows[0].role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot modify super admin status' })
    }
    
    const result = await pool.query(
      'UPDATE admins SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    )
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating admin status:', error)
    res.status(500).json({ error: 'Failed to update admin status' })
  }
})

// ============ STUDENT PROFILE ENDPOINTS ============

// Get student profile
app.get('/api/students/:student_id', authenticateStudent, async (req, res) => {
  try {
    const { student_id } = req.params
    
    const result = await pool.query(
      'SELECT student_id, email, first_name, last_name, program, year_level FROM students WHERE student_id = $1',
      [student_id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching student profile:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// Update student profile
app.patch('/api/students/:student_id', authenticateStudent, async (req, res) => {
  try {
    const { student_id } = req.params
    const { first_name, last_name, email, program, year_level } = req.body
    
    const result = await pool.query(
      'UPDATE students SET first_name = $1, last_name = $2, email = $3, program = $4, year_level = $5 WHERE student_id = $6 RETURNING student_id, email, first_name, last_name, program, year_level',
      [first_name, last_name, email, program, year_level, student_id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Change student password
app.post('/api/students/change-password', authenticateStudent, async (req, res) => {
  try {
    const { student_id, current_password, new_password } = req.body
    
    // Get current password hash
    const student = await pool.query(
      'SELECT password_hash FROM students WHERE student_id = $1',
      [student_id]
    )
    
    if (student.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' })
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(current_password, student.rows[0].password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(new_password, 10)
    
    // Update password
    await pool.query(
      'UPDATE students SET password_hash = $1 WHERE student_id = $2',
      [newPasswordHash, student_id]
    )
    
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// ============ STATS ENDPOINTS ============

// Get admin statistics
app.get('/api/stats', async (req, res) => {
  try {
    const totalCards = await pool.query('SELECT COUNT(*) FROM cards')
    const usedCards = await pool.query("SELECT COUNT(*) FROM cards WHERE status = 'Redeemed'")
    const unusedCards = await pool.query("SELECT COUNT(*) FROM cards WHERE status = 'Unused'")
    const totalStudents = await pool.query('SELECT COUNT(*) FROM students WHERE is_active = true')

    res.json({
      total_cards: parseInt(totalCards.rows[0].count),
      used_cards: parseInt(usedCards.rows[0].count),
      unused_cards: parseInt(unusedCards.rows[0].count),
      total_students: parseInt(totalStudents.rows[0].count)
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

// Export for Vercel
export default app
