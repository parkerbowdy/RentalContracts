(function () {
  var status = document.getElementById('status');
  function fail(message) { status.className = 'error'; status.textContent = message; }
  if (location.protocol === 'file:') {
    fail('This connected website must open through HTTP or HTTPS, not by double-clicking a downloaded HTML file. Your files have not been deleted.');
    return;
  }
  window.addEventListener('error', function () { fail('The application reported a startup or script error. No reset of Supabase is needed.'); });
  window.addEventListener('unhandledrejection', function () { fail('A request or application operation failed. Check your connection and try signing in again.'); });
  import('./app.js').catch(function () {
    fail('Could not load the rental application. Confirm app.js and config.js are beside index.html and refresh this page.');
  });
  setTimeout(function () {
    if (!document.getElementById('app').children.length) {
      fail('The application has not finished starting. Check the network connection and reload. A deployment still queued in GitHub must finish before it can serve these changes.');
    }
  }, 20000);
})();