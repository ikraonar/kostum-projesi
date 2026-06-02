const express = require('express')
const prisma = require('../lib/prisma')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { kategori, beden } = req.query
    const where = {}
    if (kategori) where.kategoriId = parseInt(kategori)
    if (beden) where.beden = beden

    const [kostumler, kategoriler] = await Promise.all([
      prisma.costume.findMany({
        where,
        include: { kategori: true },
        orderBy: { id: 'asc' }
      }),
      prisma.category.findMany({ orderBy: { ad: 'asc' } })
    ])

    res.render('kostumler', {
      kostumler,
      kategoriler,
      seciliKategori: kategori || '',
      seciliBeden: beden || ''
    })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

router.get('/:id', async (req, res) => {
  try {
    const kostum = await prisma.costume.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { kategori: true }
    })
    if (!kostum) return res.status(404).send('Kostüm bulunamadı.')
    res.render('kostum-detay', { kostum })
  } catch (err) {
    console.error(err)
    res.status(500).send('Sunucu hatası.')
  }
})

module.exports = router
