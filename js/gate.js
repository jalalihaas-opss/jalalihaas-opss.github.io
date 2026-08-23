(function () {
  var PASSWORD = 'movidmovid';
  var STORAGE_KEY = 'cj-wedding-unlocked';

  var gate = document.getElementById('gate');
  var card = gate.querySelector('.gate__card');
  var nav = document.querySelector('.nav');
  var main = document.getElementById('main');
  var form = document.getElementById('gate-form');
  var input = document.getElementById('gate-input');
  var error = document.getElementById('gate-error');

  function unlock() {
    gate.hidden = true;
    nav.hidden = false;
    main.hidden = false;
    document.body.classList.remove('is-locked');
  }

  var alreadyUnlocked = false;
  try {
    alreadyUnlocked = localStorage.getItem(STORAGE_KEY) === 'true';
  } catch (err) {
    alreadyUnlocked = false;
  }

  if (alreadyUnlocked) {
    unlock();
  } else {
    document.body.classList.add('is-locked');
    input.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = input.value.trim().toLowerCase();

    if (value === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch (err) {
        /* private browsing or storage disabled — still unlock for this visit */
      }
      unlock();
      return;
    }

    error.hidden = false;
    input.value = '';
    input.focus();
    card.classList.remove('gate__card--shake');
    // eslint-disable-next-line no-unused-expressions
    card.offsetWidth; // restart the animation
    card.classList.add('gate__card--shake');
  });
})();
