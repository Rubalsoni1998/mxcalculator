(function () {
  var form = document.getElementById('form'), err = document.getElementById('err'), go = document.getElementById('go');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.classList.add('hidden'); go.disabled = true;
    fetch('/admin/api/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-MX-Admin': '1' },
      body: JSON.stringify({ username: form.username.value, password: form.password.value })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) {
        if (r.ok) { location.href = '/admin/'; return; }
        err.textContent = r.j.error || 'Sign in failed.'; err.classList.remove('hidden'); go.disabled = false; form.password.select();
      })
      .catch(function () { err.textContent = 'Could not reach the server.'; err.classList.remove('hidden'); go.disabled = false; });
  });
})();
