setCurrentTheme()


function setCurrentTheme() {
    const isDarkMode = localStorage.getItem('dark_mode') === 'true'
    document.documentElement.classList.toggle('dark_mode', isDarkMode)
}
