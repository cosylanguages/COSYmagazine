/* Runs in <head>: applies the saved theme before first paint (no flash). Shared across COSY sites on this origin. */
(function () {
  try {
    var t = localStorage.getItem('cosy.theme') || localStorage.getItem('cosy_theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}
})();
