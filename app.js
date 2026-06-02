require('dotenv').config()

const express = require('express')
const session = require('express-session')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')

const { exposeCsrfToken, validateCsrf } = require('./middleware/csrf')
const { PROJECT_NOTICE } = require('./lib/constants')
const prisma = require('./lib/prisma')

const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.SESSION_SECRET) {
  console.error('Üretim ortamında SESSION_SECRET ortam değişkeni zorunludur.')
  process.exit(1)
}

const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
if (isProduction) app.set('trust proxy', 1)

//app.use(helmet({
  // Geliştirmede CSP kapalı: tarayıcı eklentileri (content.bundle.js vb.) blob worker
  // kullanır; sıkı CSP konsolda yanıltıcı hatalar üretir. Üretimde koruma açık kalır.
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          workerSrc: ["'self'", 'blob:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"]
        }
      }
    : false
//}))

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET || 'gelistirme-icin-degistirin',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  }
}))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Çok fazla deneme. Lütfen bir süre sonra tekrar deneyin.'
})

app.use(exposeCsrfToken)
app.use(validateCsrf)

app.use((req, res, next) => {
  res.locals.user = req.session.user || null
  res.locals.flash = req.session.flash || {}
  res.locals.projectNotice = PROJECT_NOTICE
  delete req.session.flash
  next()
})

const indexRoutes = require('./routes/index')
const authRoutes = require('./routes/auth')
const kostumlerRoutes = require('./routes/kostumler')
const sepetRoutes = require('./routes/sepet')
const profilRoutes = require('./routes/profil')
const adminRoutes = require('./routes/admin')

app.use('/', indexRoutes)
app.use('/', authLimiter, authRoutes)
app.use('/kostumler', kostumlerRoutes)
app.use('/', sepetRoutes)
app.use('/', profilRoutes)
app.use('/admin', adminRoutes)

const port = process.env.PORT || 3000
const server = app.listen(port, () => console.log(`http://localhost:${port}`))

function shutdown() {
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0))
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
