const STOCK_RESERVED_STATUSES = ['onaylandi', 'tamamlandi']

function reservesStock(durum) {
  return STOCK_RESERVED_STATUSES.includes(durum)
}

async function applyStockTransition(tx, order, oldDurum, newDurum) {
  const wasReserved = reservesStock(oldDurum)
  const willReserve = reservesStock(newDurum)

  if (!wasReserved && willReserve) {
    for (const item of order.items) {
      const kostum = await tx.costume.findUnique({ where: { id: item.costumeId } })
      if (!kostum || kostum.stok < item.adet) {
        throw new Error(`"${kostum?.ad || 'Kostüm'}" için yeterli stok yok (onay için gerekli: ${item.adet}, mevcut: ${kostum?.stok ?? 0}).`)
      }
    }
    for (const item of order.items) {
      await tx.costume.update({
        where: { id: item.costumeId },
        data: { stok: { decrement: item.adet } }
      })
    }
  } else if (wasReserved && !willReserve) {
    for (const item of order.items) {
      await tx.costume.update({
        where: { id: item.costumeId },
        data: { stok: { increment: item.adet } }
      })
    }
  }
}

function sortOrdersPendingFirst(orders) {
  return [...orders].sort((a, b) => {
    const aPending = a.durum === 'beklemede' ? 1 : 0
    const bPending = b.durum === 'beklemede' ? 1 : 0
    if (aPending !== bPending) return bPending - aPending
    return b.id - a.id
  })
}

module.exports = { reservesStock, applyStockTransition, sortOrdersPendingFirst, STOCK_RESERVED_STATUSES }
