const crypto = require('crypto')

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
  }
  return req.session.csrfToken
}

function exposeCsrfToken(req, res, next) {
  res.locals.csrfToken = ensureCsrfToken(req)
  next()
}

function validateCsrf(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (safeMethods.includes(req.method)) return next()

  const token = req.body._csrf || req.headers['x-csrf-token']
  if (!token || token !== req.session.csrfToken) {
    return res.status(403).send('Geçersiz veya süresi dolmuş istek. Sayfayı yenileyip tekrar deneyin.')
  }
  next()
}

module.exports = { exposeCsrfToken, validateCsrf }
