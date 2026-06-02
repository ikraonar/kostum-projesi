function safeClientMessage(err, fallback = 'İşlem tamamlanamadı.') {
  if (process.env.NODE_ENV === 'production') return fallback
  return err?.message || fallback
}

module.exports = { safeClientMessage }
