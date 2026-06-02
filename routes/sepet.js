const express = require('express')
const prisma = require('../lib/prisma')
const { requireLogin } = require('../middleware/auth')
const { safeClientMessage } = require('../middleware/errors')
const { generateUniqueKod } = require('../lib/codes')

const router = express.Router()

// GET /sepet
router.get('/sepet', requireLogin, async (req, res) => {
  try {
    const sepet = req.session.sepet || []
    const ids = sepet.map(i => i.costumeId)
    const kostumler = ids.length
      ? await prisma.costume.findMany({ where: { id: { in: ids } } })
      : []
    const kostumMap = new Map(kostumler.map(k => [k.id, k]))
    const items = sepet.map(item => ({
      costumeId: item.costumeId,
      adet: item.adet,
      kostum: kostumMap.get(item.costumeId) || null
    }))
    const toplam = items.reduce((acc, i) => acc + (i.kostum?.fiyat || 0) * i.adet, 0)
    res.render('sepet', { items, toplam })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

// POST /sepet/ekle
router.post('/sepet/ekle', requireLogin, async (req, res) => {
  try {
    const costumeId = parseInt(req.body.costumeId)
    const adet = Math.max(1, parseInt(req.body.adet) || 1)
    if (!costumeId) return res.redirect('/kostumler')

    const sepet = req.session.sepet || []
    const mevcut = sepet.find(i => i.costumeId === costumeId)
    if (mevcut) {
      mevcut.adet += adet
    } else {
      sepet.push({ costumeId, adet })
    }
    req.session.sepet = sepet
    res.redirect('/sepet')
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

// POST /sepet/sil/:costumeId
router.post('/sepet/sil/:costumeId', requireLogin, (req, res) => {
  const costumeId = parseInt(req.params.costumeId)
  req.session.sepet = (req.session.sepet || []).filter(i => i.costumeId !== costumeId)
  res.redirect('/sepet')
})

// POST /siparis/olustur
router.post('/siparis/olustur', requireLogin, async (req, res) => {
  try {
    const sepet = req.session.sepet || []
    if (sepet.length === 0) {
      req.session.flash = { hata: 'Sepetiniz boş.' }
      return res.redirect('/sepet')
    }

    const baslangic = new Date(req.body.baslangic)
    const bitis = new Date(req.body.bitis)

    if (isNaN(baslangic) || isNaN(bitis) || baslangic >= bitis) {
      req.session.flash = { hata: 'Geçerli bir tarih aralığı seçin (başlangıç < bitiş).' }
      return res.redirect('/sepet')
    }

    await prisma.$transaction(async (tx) => {
      let toplamFiyat = 0
      const cozulenItems = []

      for (const item of sepet) {
        const kostum = await tx.costume.findUnique({ where: { id: item.costumeId } })
        if (!kostum) throw new Error(`Kostüm (id: ${item.costumeId}) bulunamadı.`)
        if (kostum.stok < item.adet) {
          throw new Error(`"${kostum.ad}" için yeterli stok yok. Mevcut: ${kostum.stok}, İstenen: ${item.adet}`)
        }

        // Tarih çakışması: aynı costume için iptal olmayan, tarih aralığı kesişen sipariş var mı?
        const cakisma = await tx.order.findFirst({
          where: {
            durum: { not: 'iptal' },
            items: { some: { costumeId: item.costumeId } },
            AND: [
              { baslangic: { lt: bitis } },
              { bitis: { gt: baslangic } }
            ]
          }
        })
        if (cakisma) {
          throw new Error(`"${kostum.ad}" seçilen tarihlerde başka bir siparişe ait.`)
        }

        toplamFiyat += kostum.fiyat * item.adet
        cozulenItems.push({ costumeId: item.costumeId, adet: item.adet })
      }

      const itemsCreate = []
      for (const item of cozulenItems) {
        const birimler = []
        for (let i = 0; i < item.adet; i++) {
          birimler.push({ kod: await generateUniqueKod(tx) })
        }
        itemsCreate.push({
          costumeId: item.costumeId,
          adet: item.adet,
          birimler: { create: birimler }
        })
      }

      await tx.order.create({
        data: {
          userId: req.session.user.id,
          toplamFiyat,
          baslangic,
          bitis,
          items: { create: itemsCreate }
        }
      })
    })

    req.session.sepet = []
    req.session.flash = { basari: 'Siparişiniz oluşturuldu! Her ürün için benzersiz kodlar profilinizde listelenir.' }
    res.redirect('/profil')
  } catch (err) {
    console.error(err)
    req.session.flash = { hata: safeClientMessage(err, 'Sipariş oluşturulamadı.') }
    res.redirect('/sepet')
  }
})

module.exports = router
