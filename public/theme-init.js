(function () {
  var key = 'StackColorScheme';
  var saved = null;
  try {
    saved = localStorage.getItem(key);
  } catch (e) {}
  if (saved !== 'light' && saved !== 'dark') saved = 'auto';
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = saved === 'dark' || (saved === 'auto' && prefersDark);
  document.documentElement.setAttribute('data-scheme', dark ? 'dark' : 'light');
})();
