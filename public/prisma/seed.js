const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Kategoriler
  const kategoriler = await Promise.all([
    prisma.category.create({ data: { ad: 'Tarihi' } }),
    prisma.category.create({ data: { ad: 'Fantastik' } }),
    prisma.category.create({ data: { ad: 'Korku' } }),
    prisma.category.create({ data: { ad: 'Çizgi Film' } }),
  ])

  // Kostümler
  await prisma.costume.createMany({
    data: [
      { ad: 'Ortaçağ Şövalyesi', kategoriId: kategoriler[0].id, beden: 'L', fiyat: 250, stok: 3 },
      { ad: 'Osmanlı Padişahı', kategoriId: kategoriler[0].id, beden: 'M', fiyat: 300, stok: 2 },
      { ad: 'Ejderha Savaşçısı', kategoriId: kategoriler[1].id, beden: 'XL', fiyat: 350, stok: 2 },
      { ad: 'Elf Prenses', kategoriId: kategoriler[1].id, beden: 'S', fiyat: 280, stok: 4 },
      { ad: 'Vampir Kontu', kategoriId: kategoriler[2].id, beden: 'L', fiyat: 200, stok: 5 },
      { ad: 'Cadı', kategoriId: kategoriler[2].id, beden: 'M', fiyat: 180, stok: 6 },
      { ad: 'Süper Kahraman', kategoriId: kategoriler[3].id, beden: 'M', fiyat: 220, stok: 3 },
      { ad: 'Anime Karakteri', kategoriId: kategoriler[3].id, beden: 'S', fiyat: 260, stok: 4 },
    ]
  })

  // Admin kullanıcı
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.create({
    data: {
      adSoyad: 'Site Admin',
      email: 'admin@kostumsis.com',
      sifre: hash,
      rol: 'admin'
    }
  })

  console.log('Seed tamamlandı.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())