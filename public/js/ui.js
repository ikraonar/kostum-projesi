// Flash auto-dismiss
document.querySelectorAll('.flash-bar .alert').forEach(alert => {
  setTimeout(() => {
    alert.style.transition = 'opacity 0.5s ease'
    alert.style.opacity = '0'
    setTimeout(() => {
      const bar = alert.closest('.flash-bar')
      if (bar) bar.remove()
    }, 500)
  }, 4000)
})

// Hamburger menu
const navToggle = document.querySelector('.nav-toggle')
const navLinks  = document.querySelector('.navbar-links')
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'))
  document.addEventListener('click', e => {
    if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open')
    }
  })
}

// Costume card fade-in on scroll
if ('IntersectionObserver' in window) {
  const cards = document.querySelectorAll('.costume-card')
  cards.forEach(c => {
    c.style.opacity = '0'
    c.style.transform = 'translateY(14px)'
  })
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.transition = 'opacity 0.38s ease, transform 0.38s ease'
        entry.target.style.opacity = '1'
        entry.target.style.transform = 'translateY(0)'
        io.unobserve(entry.target)
      }
    })
  }, { threshold: 0.06 })
  cards.forEach(c => io.observe(c))
}
