/* Runs in <head>: applies the saved theme before first paint (no flash). Shared across COSY sites on this origin. */
(function () {
  document.documentElement.classList.add('js');
  try {
    var t = localStorage.getItem('cosy.theme') || localStorage.getItem('cosy_theme');
    if (t === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
