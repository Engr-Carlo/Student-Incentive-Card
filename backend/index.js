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
let transporter
const isEmailConfigured = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your-gmail-account@gmail.com'

if (isEmailConfigured) {
  try {
    const emailUser = process.env.EMAIL_USER || ''
    let emailConfig
    
    if (emailUser.includes('@outlook.com') || emailUser.includes('@hotmail.com')) {
      emailConfig = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      }
    } else {
      emailConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    }
    
    transporter = nodemailer.createTransport(emailConfig)
  
    // Verify transporter configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.log('⚠️  Email service error:', error.message)
        console.log('📧 Falling back to console-only mode')
      } else {
        console.log('✅ Email service is ready to send messages')
      }
    })
  } catch (error) {
    console.log('⚠️  Could not initialize email service:', error.message)
  }
} else {
  console.log('📧 Email not configured - running in CONSOLE MODE (codes will appear in terminal)')
}

// In-memory storage for verification codes (use Redis in production)
const verificationCodes = new Map()

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err)
  } else {
    console.log('✅ Database connected successfully')
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

// Handle preflight requests
app.options('*', cors(corsOptions))

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

// ============ STUDENT AUTHENTICATION ENDPOINTS ============

// Send verification code to email
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body

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

    // Send email
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

    // Send email or log to console if not configured
    if (isEmailConfigured && transporter) {
      await transporter.sendMail(mailOptions)
      console.log(`✅ Verification code sent to ${email}`)
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
    res.status(500).json({ error: 'Failed to send verification code' })
  }
})

// Verify email code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body

    const stored = verificationCodes.get(email)
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' })
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email)
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' })
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Code is valid - keep it for registration
    res.json({ message: 'Email verified successfully' })
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
    const { email } = req.body

    // Find student by email
    const result = await pool.query(
      'SELECT * FROM students WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address' })
    }

    const student = result.rows[0]

    if (!isEmailConfigured) {
      return res.status(503).json({ error: 'Email service not configured. Please contact administrator.' })
    }

    // Generate unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    
    // Store token with 1-hour expiration
    resetTokens.set(resetToken, {
      email: student.email,
      type: 'student',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    })

    // Build reset link based on environment
    const studentAppUrl = process.env.STUDENT_APP_URL || 'https://incentive-card-student.vercel.app'
    const resetLink = `${studentAppUrl}/reset-password?token=${resetToken}`

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

    await transporter.sendMail(mailOptions)

    res.json({ message: 'Password reset link has been sent to your email address' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Failed to send password reset email' })
  }
})

// Reset student password with token
app.post('/api/students/reset-password', async (req, res) => {
  try {
    console.log('Reset password request received')
    const { token, newPassword } = req.body
    console.log('Token received:', token ? 'Yes' : 'No')
    console.log('New password received:', newPassword ? 'Yes' : 'No')

    // Validate token
    const tokenData = resetTokens.get(token)
    console.log('Token data found:', tokenData ? 'Yes' : 'No')
    
    if (!tokenData || tokenData.type !== 'student') {
      console.log('Invalid token or wrong type')
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    // Check if token expired
    if (Date.now() > tokenData.expires) {
      console.log('Token expired')
      resetTokens.delete(token)
      return res.status(400).json({ error: 'Reset token has expired' })
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      console.log('Password validation failed')
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    console.log('Hashing password...')
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('Updating database for email:', tokenData.email)
    // Update student password
    await pool.query(
      'UPDATE students SET password_hash = $1, password = $2 WHERE email = $3',
      [hashedPassword, newPassword, tokenData.email]
    )

    // Delete used token
    resetTokens.delete(token)
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
    res.json(result.rows)
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

// Redeem a card (Admin - via QR scan)
app.post('/api/admin/cards/:cardId/redeem', authenticateAdmin, async (req, res) => {
  try {
    const { cardId } = req.params

    // Check if card exists
    const cardCheck = await pool.query(
      'SELECT * FROM cards WHERE id = $1',
      [cardId]
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
      message: 'Card redeemed successfully by admin',
      card: result.rows[0]
    })
  } catch (error) {
    console.error('Error redeeming card (admin):', error)
    res.status(500).json({ error: 'Failed to redeem card' })
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
