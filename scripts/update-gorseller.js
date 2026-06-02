const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const gorselMap = [
  { ad: 'Ortaçağ Şövalyesi',  gorsel: '/images/sovalye.png' },
  { ad: 'Osmanlı Padişahı',   gorsel: '/images/padisah.png' },
  { ad: 'Ejderha Savaşçısı',  gorsel: '/images/ejderha-savascisi.png' },
  { ad: 'Elf Prenses',        gorsel: '/images/elf-prensesi.png' },
  { ad: 'Vampir Kontu',       gorsel: '/images/vampir.png' },
  { ad: 'Cadı',               gorsel: '/images/cadi.png' },
  { ad: 'Süper Kahraman',     gorsel: '/images/super-kahraman.png' },
  { ad: 'Anime Karakteri',    gorsel: '/images/anime.png' },
]

async function main() {
  for (const { ad, gorsel } of gorselMap) {
    const result = await prisma.costume.updateMany({
      where: { ad },
      data: { gorsel }
    })
    console.log(`${result.count > 0 ? '✓' : '✗'} ${ad} → ${gorsel}`)
  }
  const kostumler = await prisma.costume.findMany({ select: { id: true, ad: true, gorsel: true }, orderBy: { id: 'asc' } })
  console.log('\n--- Güncel Durum ---')
  kostumler.forEach(k => console.log(`[${k.id}] ${k.ad} → ${k.gorsel}`))
}

main().catch(console.error).finally(() => prisma.$disconnect())
