/*
 * COSY quiz: turns the static quiz markup into a working quiz.
 * Without JavaScript the page still shows the answers and the explanation (see build-blog.js).
 * With JavaScript: choose an option; wrong answers are marked and can be retried;
 * the right answer reveals the explanation. Nothing is stored or sent anywhere.
 */
(function () {
  'use strict';

  function setMark(btn, symbol) {
    var mark = btn.querySelector('.quiz-mark');
    if (mark) mark.textContent = symbol;
  }

  function initQuiz(card) {
    var buttons = Array.prototype.slice.call(card.querySelectorAll('.quiz-option-btn'));
    var explanation = card.querySelector('.quiz-explanation');
    var feedback = card.querySelector('.quiz-feedback');
    var finished = false;

    buttons.forEach(function (btn) { setMark(btn, '\u26AA'); });
    if (explanation) explanation.hidden = true;
    card.classList.add('quiz-ready');

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (finished || btn.disabled) return;
        if (btn.getAttribute('data-correct') === 'true') {
          finished = true;
          btn.classList.add('is-correct');
          setMark(btn, '\u2705');
          buttons.forEach(function (b) { b.disabled = true; });
          if (explanation) explanation.hidden = false;
          if (feedback) feedback.textContent = 'Correct!';
        } else {
          btn.classList.add('is-wrong');
          btn.disabled = true;
          setMark(btn, '\u274C');
          if (feedback) feedback.textContent = 'Not quite. Try again.';
        }
      });
    });
  }

  function initQuizzes(scope) {
    var cards = (scope || document).querySelectorAll('.gazette-quiz-card');
    Array.prototype.forEach.call(cards, initQuiz);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initQuiz: initQuiz, initQuizzes: initQuizzes };
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { initQuizzes(); });
    else initQuizzes();
  }
})();
