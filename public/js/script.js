(() => {
  'use strict'

  const themeToggle = document.getElementById('themeToggle')
  const root = document.documentElement

  const updateThemeToggle = () => {
    const isDark = root.dataset.theme === 'dark'
    themeToggle.innerHTML = isDark
      ? '<i class="fa-solid fa-sun"></i>'
      : '<i class="fa-solid fa-moon"></i>'
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode')
    themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode')
  }

  if (themeToggle) {
    updateThemeToggle()
    themeToggle.addEventListener('click', () => {
      const isDark = root.dataset.theme === 'dark'
      root.dataset.theme = isDark ? 'light' : 'dark'
      localStorage.setItem('wandernest-theme', isDark ? 'light' : 'dark')
      updateThemeToggle()
    })
  }

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll('.needs-validation')

  // Loop over them and prevent submission
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})()