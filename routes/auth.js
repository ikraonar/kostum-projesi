const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')
const { EMAIL_REGEX, MIN_PASSWORD_LENGTH } = require('../lib/constants')

const router = express.Router()

router.get('/giris', (req, res) => {
  res.render('giris')
})

router.post('/auth/kayit', async (req, res) => {
  try {
    const { adSoyad, email, sifre } = req.body
    if (!adSoyad || !email || !sifre) {
      req.session.flash = { hata: 'Tüm alanları doldurun.' }
      return res.redirect('/giris')
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      req.session.flash = { hata: 'Geçerli bir e-posta adresi girin.' }
      return res.redirect('/giris')
    }
    if (sifre.length < MIN_PASSWORD_LENGTH) {
      req.session.flash = { hata: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.` }
      return res.redirect('/giris')
    }
    const mevcut = await prisma.user.findUnique({ where: { email } })
    if (mevcut) {
      req.session.flash = { hata: 'Bu e-posta adresi zaten kayıtlı.' }
      return res.redirect('/giris')
    }
    const hash = await bcrypt.hash(sifre, 10)
    const user = await prisma.user.create({
      data: { adSoyad, email, sifre: hash }
    })
    req.session.user = { id: user.id, adSoyad: user.adSoyad, email: user.email, rol: user.rol }
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

router.post('/auth/giris', async (req, res) => {
  try {
    const { email, sifre } = req.body
    if (!email || !sifre) {
      req.session.flash = { hata: 'E-posta ve şifre gerekli.' }
      return res.redirect('/giris')
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(sifre, user.sifre))) {
      req.session.flash = { hata: 'E-posta veya şifre hatalı.' }
      return res.redirect('/giris')
    }
    req.session.user = { id: user.id, adSoyad: user.adSoyad, email: user.email, rol: user.rol }
    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

router.post('/auth/cikis', (req, res) => {
  req.session.destroy(() => res.redirect('/'))
})

module.exports = router
