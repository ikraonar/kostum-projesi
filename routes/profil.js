const express = require('express')
const bcrypt = require('bcrypt')
const prisma = require('../lib/prisma')
const { requireLogin } = require('../middleware/auth')

const router = express.Router()

router.get('/profil', requireLogin, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.user.id } })
    const orders = await prisma.order.findMany({
      where: { userId: req.session.user.id },
      include: {
        items: {
          include: {
            costume: true,
            birimler: { orderBy: { id: 'asc' } }
          }
        }
      },
      orderBy: { id: 'desc' }
    })
    res.render('profil', { profilUser: user, orders })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

router.post('/profil/guncelle', requireLogin, async (req, res) => {
  try {
    const { adSoyad } = req.body
    if (!adSoyad || !adSoyad.trim()) {
      req.session.flash = { hata: 'Ad soyad boş bırakılamaz.' }
      return res.redirect('/profil')
    }
    const updated = await prisma.user.update({
      where: { id: req.session.user.id },
      data: { adSoyad: adSoyad.trim() }
    })
    req.session.user.adSoyad = updated.adSoyad
    req.session.flash = { basari: 'Bilgileriniz güncellendi.' }
    res.redirect('/profil')
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

router.post('/profil/sifre', requireLogin, async (req, res) => {
  try {
    const { eskiSifre, yeniSifre } = req.body
    if (!eskiSifre || !yeniSifre) {
      req.session.flash = { hata: 'Tüm şifre alanlarını doldurun.' }
      return res.redirect('/profil')
    }
    const user = await prisma.user.findUnique({ where: { id: req.session.user.id } })
    const eslesme = await bcrypt.compare(eskiSifre, user.sifre)
    if (!eslesme) {
      req.session.flash = { hata: 'Mevcut şifre hatalı.' }
      return res.redirect('/profil')
    }
    if (yeniSifre.length < 6) {
      req.session.flash = { hata: 'Yeni şifre en az 6 karakter olmalı.' }
      return res.redirect('/profil')
    }
    const hash = await bcrypt.hash(yeniSifre, 10)
    await prisma.user.update({
      where: { id: req.session.user.id },
      data: { sifre: hash }
    })
    req.session.flash = { basari: 'Şifreniz başarıyla güncellendi.' }
    res.redirect('/profil')
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

module.exports = router
