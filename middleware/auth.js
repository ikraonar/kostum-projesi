function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/giris')
  next()
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.rol !== 'admin') {
    return res.status(403).send('Erişim reddedildi.')
  }
  next()
}

module.exports = { requireLogin, requireAdmin }
