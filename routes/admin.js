const express = require('express')
const prisma = require('../lib/prisma')
const { requireAdmin } = require('../middleware/auth')
const { applyStockTransition, sortOrdersPendingFirst } = require('../lib/orderStock')
const { safeClientMessage } = require('../middleware/errors')

const router = express.Router()

// GET /admin — Dashboard
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [kostumSayisi, siparisSayisi, bekleyenSayisi, sonSiparisler] = await Promise.all([
      prisma.costume.count(),
      prisma.order.count(),
      prisma.order.count({ where: { durum: 'beklemede' } }),
      prisma.order.findMany({
        take: 20,
        include: { user: true },
        orderBy: { id: 'desc' }
      }).then(sortOrdersPendingFirst).then(list => list.slice(0, 5))
    ])
    res.render('admin/dashboard', { kostumSayisi, siparisSayisi, bekleyenSayisi, sonSiparisler, adminPage: 'dashboard' })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

// GET /admin/kostumler
router.get('/kostumler', requireAdmin, async (req, res) => {
  try {
    const [kostumler, kategoriler] = await Promise.all([
      prisma.costume.findMany({ include: { kategori: true }, orderBy: { id: 'asc' } }),
      prisma.category.findMany({ orderBy: { ad: 'asc' } })
    ])
    res.render('admin/kostumler', { kostumler, kategoriler, adminPage: 'kostumler' })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

// POST /admin/kostumler/ekle
router.post('/kostumler/ekle', requireAdmin, async (req, res) => {
  try {
    const { ad, kategoriId, beden, fiyat, stok, gorsel } = req.body
    if (!ad || !kategoriId || !beden || !fiyat || stok === undefined) {
      req.session.flash = { hata: 'Tüm zorunlu alanları doldurun.' }
      return res.redirect('/admin/kostumler')
    }
    await prisma.costume.create({
      data: {
        ad: ad.trim(),
        kategoriId: parseInt(kategoriId),
        beden,
        fiyat: parseFloat(fiyat),
        stok: parseInt(stok),
        gorsel: gorsel?.trim() || null
      }
    })
    req.session.flash = { basari: `"${ad}" başarıyla eklendi.` }
    res.redirect('/admin/kostumler')
  } catch (err) {
    console.error(err)
    req.session.flash = { hata: 'Kostüm eklenemedi.' }
    res.redirect('/admin/kostumler')
  }
})

// POST /admin/kostumler/:id/guncelle
router.post('/kostumler/:id/guncelle', requireAdmin, async (req, res) => {
  try {
    const { ad, kategoriId, beden, fiyat, stok, gorsel } = req.body
    await prisma.costume.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ad: ad.trim(),
        kategoriId: parseInt(kategoriId),
        beden,
        fiyat: parseFloat(fiyat),
        stok: parseInt(stok),
        gorsel: gorsel?.trim() || null
      }
    })
    req.session.flash = { basari: 'Kostüm güncellendi.' }
    res.redirect('/admin/kostumler')
  } catch (err) {
    console.error(err)
    req.session.flash = { hata: 'Kostüm güncellenemedi.' }
    res.redirect('/admin/kostumler')
  }
})

// POST /admin/kostumler/:id/sil
router.post('/kostumler/:id/sil', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const siparisSayisi = await prisma.orderItem.count({ where: { costumeId: id } })
    if (siparisSayisi > 0) {
      req.session.flash = { hata: 'Bu kostüme ait siparişler mevcut; silinemez.' }
      return res.redirect('/admin/kostumler')
    }
    await prisma.costume.delete({ where: { id } })
    req.session.flash = { basari: 'Kostüm silindi.' }
    res.redirect('/admin/kostumler')
  } catch (err) {
    console.error(err)
    req.session.flash = { hata: 'Kostüm silinemedi.' }
    res.redirect('/admin/kostumler')
  }
})

// GET /admin/siparisler
router.get('/siparisler', requireAdmin, async (req, res) => {
  try {
    const siparislerRaw = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            costume: true,
            birimler: { orderBy: { id: 'asc' } }
          }
        }
      },
      orderBy: { id: 'desc' }
    })
    const siparisler = sortOrdersPendingFirst(siparislerRaw)
    res.render('admin/siparisler', { siparisler, adminPage: 'siparisler' })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

// POST /admin/siparisler/:id/durum
router.post('/siparisler/:id/durum', requireAdmin, async (req, res) => {
  try {
    const { durum } = req.body
    const gecerli = ['beklemede', 'onaylandi', 'tamamlandi', 'iptal']
    if (!gecerli.includes(durum)) {
      req.session.flash = { hata: 'Geçersiz sipariş durumu.' }
      return res.redirect('/admin/siparisler')
    }
    const orderId = parseInt(req.params.id)

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      })
      if (!order) throw new Error('Sipariş bulunamadı.')
      if (order.durum === durum) return

      await applyStockTransition(tx, order, order.durum, durum)
      await tx.order.update({
        where: { id: orderId },
        data: { durum }
      })
    })

    const stokMesaj = durum === 'onaylandi' || durum === 'tamamlandi'
      ? ' Stok güncellendi.'
      : durum === 'iptal'
        ? ' Stok iade edildi.'
        : ''
    req.session.flash = { basari: `Sipariş durumu güncellendi.${stokMesaj}` }
    res.redirect('/admin/siparisler')
  } catch (err) {
    console.error(err)
    req.session.flash = { hata: safeClientMessage(err, 'Durum güncellenemedi.') }
    res.redirect('/admin/siparisler')
  }
})

module.exports = router
