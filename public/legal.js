const root = document.documentElement;
const themeButton = document.querySelector('#theme-toggle');
const colorPreference = matchMedia('(prefers-color-scheme: dark)');
let theme = localStorage.getItem('yn_theme') || (colorPreference.matches ? 'dark' : 'light');

function applyTheme() {
  root.dataset.theme = theme;
  const dark = theme === 'dark';
  themeButton.textContent = dark ? '☾' : '☀';
  themeButton.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  themeButton.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
}

applyTheme();
themeButton.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('yn_theme', theme);
  applyTheme();
});
colorPreference.addEventListener?.('change', event => {
  if (!localStorage.getItem('yn_theme')) {
    theme = event.matches ? 'dark' : 'light';
    applyTheme();
  }
});
