const crypto = require('crypto')

function generateKod() {
  return `KS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

async function generateUniqueKod(tx, maxRetries = 8) {
  for (let i = 0; i < maxRetries; i++) {
    const kod = generateKod()
    const exists = await tx.orderItemUnit.findUnique({ where: { kod } })
    if (!exists) return kod
  }
  throw new Error('Benzersiz ürün kodu üretilemedi.')
}

function buildUnitCreates(adet, kodUretici) {
  return Array.from({ length: adet }, () => ({ kod: kodUretici() }))
}

module.exports = { generateKod, generateUniqueKod, buildUnitCreates }
