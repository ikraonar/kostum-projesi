(function () {
  const STORAGE_KEY = 'kostumsis-theme'
  const root = document.documentElement
  const toggle = document.getElementById('theme-toggle')
  const icon = document.getElementById('theme-toggle-icon')
  const label = document.getElementById('theme-toggle-label')
  const metaTheme = document.getElementById('meta-theme-color')

  function getTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#0f0d14' : '#2D1B4E')
    if (icon) icon.textContent = theme === 'dark' ? '☾' : '☀'
    if (label) label.textContent = theme === 'dark' ? 'Koyu' : 'Açık'
    if (toggle) toggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')
  }

  applyTheme(getTheme())

  if (toggle) {
    toggle.addEventListener('click', () => {
      applyTheme(getTheme() === 'dark' ? 'light' : 'dark')
    })
  }
})()
