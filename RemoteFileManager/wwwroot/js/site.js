export function toggleTheme() {
    const isDarkMode = localStorage.getItem('dark_mode') === 'true'

    localStorage.setItem('dark_mode', !isDarkMode)
    document.documentElement.classList.toggle('dark_mode', !isDarkMode)
}
