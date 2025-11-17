import express from 'express'
import cors from 'cors'
import pg from 'pg'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

dotenv.config()

const { Pool } = pg
const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

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
app.use(cors())
app.use(express.json())

// ============ AUTHENTICATION ENDPOINTS ============

// Register new student
app.post('/api/auth/register', async (req, res) => {
  try {
    const { student_id, email, password, first_name, last_name, program, year_level } = req.body

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

// ============ CARDS ENDPOINTS ============

// Get all cards
app.get('/api/cards', async (req, res) => {
  try {
    const { student_id } = req.query
    let query = 'SELECT * FROM cards'
    let params = []
    
    if (student_id) {
      query += ' WHERE student_id = $1'
      params.push(student_id)
    }
    
    query += ' ORDER BY issued_date DESC'
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching cards:', error)
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// Get single card
app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM cards WHERE id = $1', [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Card not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching card:', error)
    res.status(500).json({ error: 'Failed to fetch card' })
  }
})

// Issue a new card
app.post('/api/cards', async (req, res) => {
  try {
    const { student_id, student_name, event, tier } = req.body
    
    // Determine benefits based on tier
    let benefits = []
    if (tier === 'Gold') {
      benefits = ['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam']
    } else if (tier === 'Silver') {
      benefits = ['1 Quiz Exemption', '1 Activity Exemption']
    } else {
      benefits = ['1 Activity Exemption']
    }
    
    const qr_code = `qr-${Date.now()}`
    
    const result = await pool.query(
      `INSERT INTO cards (student_id, student_name, event, tier, benefits, qr_code) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [student_id, student_name, event, tier, benefits, qr_code]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error issuing card:', error)
    res.status(500).json({ error: 'Failed to issue card' })
  }
})

// ============ REDEMPTION REQUESTS ENDPOINTS ============

// Get all redemption requests
app.get('/api/requests', async (req, res) => {
  try {
    const { status, student_id } = req.query
    let query = 'SELECT * FROM redemption_requests'
    let params = []
    let conditions = []
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }
    
    if (student_id) {
      conditions.push(`student_id = $${params.length + 1}`)
      params.push(student_id)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY submitted_date DESC'
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching requests:', error)
    res.status(500).json({ error: 'Failed to fetch requests' })
  }
})

// Submit redemption request
app.post('/api/requests', async (req, res) => {
  try {
    const { card_id, student_id, student_name, course, benefit } = req.body
    
    const result = await pool.query(
      `INSERT INTO redemption_requests (card_id, student_id, student_name, course, benefit) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [card_id, student_id, student_name, course, benefit]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error submitting request:', error)
    res.status(500).json({ error: 'Failed to submit request' })
  }
})

// Approve redemption request
app.post('/api/requests/:id/approve', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const { id } = req.params
    
    // Update request status
    const requestResult = await client.query(
      `UPDATE redemption_requests 
       SET status = 'Approved' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    )
    
    if (requestResult.rows.length === 0) {
      throw new Error('Request not found')
    }
    
    const request = requestResult.rows[0]
    
    // Update card status to Redeemed
    await client.query(
      `UPDATE cards 
       SET status = 'Redeemed', redeemed_date = CURRENT_DATE 
       WHERE id = $1`,
      [request.card_id]
    )
    
    await client.query('COMMIT')
    res.json(request)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error approving request:', error)
    res.status(500).json({ error: 'Failed to approve request' })
  } finally {
    client.release()
  }
})

// Deny redemption request
app.post('/api/requests/:id/deny', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `UPDATE redemption_requests 
       SET status = 'Denied' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error denying request:', error)
    res.status(500).json({ error: 'Failed to deny request' })
  }
})

// ============ PROOF SUBMISSIONS ENDPOINTS ============

// Get all proof submissions
app.get('/api/proofs', async (req, res) => {
  try {
    const { status, student_id } = req.query
    let query = 'SELECT * FROM proof_submissions'
    let params = []
    let conditions = []
    
    if (status) {
      conditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }
    
    if (student_id) {
      conditions.push(`student_id = $${params.length + 1}`)
      params.push(student_id)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY submitted_date DESC'
    
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching proofs:', error)
    res.status(500).json({ error: 'Failed to fetch proofs' })
  }
})

// Submit proof
app.post('/api/proofs', async (req, res) => {
  try {
    const { student_id, student_name, event_name, event_type, files } = req.body
    
    const result = await pool.query(
      `INSERT INTO proof_submissions (student_id, student_name, event_name, event_type, files) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [student_id, student_name, event_name, event_type, files]
    )
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error submitting proof:', error)
    res.status(500).json({ error: 'Failed to submit proof' })
  }
})

// Approve proof and issue card
app.post('/api/proofs/:id/approve', async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    const { id } = req.params
    const { tier } = req.body
    
    // Update proof status
    const proofResult = await client.query(
      `UPDATE proof_submissions 
       SET status = 'Approved' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    )
    
    if (proofResult.rows.length === 0) {
      throw new Error('Proof not found')
    }
    
    const proof = proofResult.rows[0]
    
    // Determine benefits based on tier
    let benefits = []
    if (tier === 'Gold') {
      benefits = ['1 Quiz Exemption', '1 Activity Exemption', '+2 Pts in Exam']
    } else if (tier === 'Silver') {
      benefits = ['1 Quiz Exemption', '1 Activity Exemption']
    } else {
      benefits = ['1 Activity Exemption']
    }
    
    const qr_code = `qr-${Date.now()}`
    
    // Issue new card
    await client.query(
      `INSERT INTO cards (student_id, student_name, event, tier, benefits, qr_code) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [proof.student_id, proof.student_name, proof.event_name, tier, benefits, qr_code]
    )
    
    await client.query('COMMIT')
    res.json(proof)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error approving proof:', error)
    res.status(500).json({ error: 'Failed to approve proof' })
  } finally {
    client.release()
  }
})

// Deny proof
app.post('/api/proofs/:id/deny', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `UPDATE proof_submissions 
       SET status = 'Denied' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proof not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error denying proof:', error)
    res.status(500).json({ error: 'Failed to deny proof' })
  }
})

// ============ STATS ENDPOINTS ============

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT student_id) as unique_students,
        SUM(CASE WHEN status = 'Redeemed' THEN 1 ELSE 0 END) as redeemed,
        (SELECT COUNT(*) FROM redemption_requests WHERE status = 'Pending') as pending_requests
      FROM cards
    `)
    
    res.json(stats.rows[0])
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get recent activity
app.get('/api/activity', async (req, res) => {
  try {
    const result = await pool.query(`
      (SELECT 'Card Issued' as type, student_name || ' - ' || event as description, issued_date as date 
       FROM cards ORDER BY issued_date DESC LIMIT 5)
      UNION ALL
      (SELECT 'Redemption' as type, student_name || ' - ' || course as description, submitted_date as date 
       FROM redemption_requests WHERE status = 'Approved' ORDER BY submitted_date DESC LIMIT 5)
      ORDER BY date DESC
      LIMIT 10
    `)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching activity:', error)
    res.status(500).json({ error: 'Failed to fetch activity' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
