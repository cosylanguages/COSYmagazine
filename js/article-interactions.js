/**
 * COSYmagazine article interactions (no dependencies).
 *  - Quiz cards: pick an answer, see right/wrong, then the explanation. Nothing is spoiled up front.
 * Works in flipbook and scroll mode (event delegation on the document).
 */
(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.gazette-quiz-card[data-quiz] .quiz-option-btn') : null;
    if (!btn) return;
    var card = btn.closest('.gazette-quiz-card');
    if (card.getAttribute('data-answered') === 'true') return;
    card.setAttribute('data-answered', 'true');

    var buttons = card.querySelectorAll('.quiz-option-btn');
    var isRight = btn.getAttribute('data-correct') === 'true';
    buttons.forEach(function (b) {
      var correct = b.getAttribute('data-correct') === 'true';
      var mark = b.querySelector('.quiz-mark');
      b.disabled = true;
      if (correct) { b.classList.add('is-correct'); if (mark) mark.textContent = '✅'; }
      else if (b === btn) { b.classList.add('is-wrong'); if (mark) mark.textContent = '❌'; }
      else { b.classList.add('is-dim'); }
    });
    card.classList.add(isRight ? 'quiz-right' : 'quiz-wrong');
    var ex = card.querySelector('.quiz-explanation');
    if (ex) { ex.hidden = false; }
  });
})();
