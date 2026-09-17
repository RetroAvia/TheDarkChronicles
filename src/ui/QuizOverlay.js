import { el } from './dom.js';
import { CATEGORY_META } from '../narrative/quiz.js';

/** Between-level trivia/riddle/logic-puzzle screen. Never BLOCKS progress —
 * "Continua" is always available once you've picked an answer, whichever it
 * was — but a wrong answer now costs a small score malus (bonusPoints/
 * malusPoints passed in by Game.showQuiz) so right vs wrong actually means
 * something beyond a fun fact, per the user's explicit request. */
export function QuizOverlay({ question, bonusPoints = 250, malusPoints = 100, onAnswer, onContinue }) {
  let answered = false;
  const meta = CATEGORY_META[question.category] || CATEGORY_META.trivia;

  const factEl = el('p', { class: 'ra-quiz-fact', style: 'opacity:0;' }, question.fact);
  const continueBtn = el('button', {
    class: 'ra-btn ra-btn--primary',
    style: 'opacity:0;pointer-events:none;margin-top:14px;',
    onclick: onContinue
  }, '➡️ Continua');

  const resultLabel = el('p', { class: 'ra-quiz-result', style: 'opacity:0;' }, '');

  const answerButtons = question.answers.map((text, i) => {
    const btn = el('button', {
      class: 'ra-quiz-answer',
      onclick: () => {
        if (answered) return;
        answered = true;
        const isCorrect = i === question.correct;

        answerButtons.forEach((b, j) => {
          b.classList.add('disabled');
          if (j === question.correct) b.classList.add('correct');
          else if (j === i) b.classList.add('wrong');
        });

        resultLabel.textContent = isCorrect
          ? `✅ Esatto! +${bonusPoints} punti`
          : `❌ Non proprio... -${malusPoints} punti`;
        resultLabel.classList.add(isCorrect ? 'good' : 'bad');
        resultLabel.style.opacity = '1';
        factEl.style.opacity = '1';
        continueBtn.style.opacity = '1';
        continueBtn.style.pointerEvents = 'auto';

        onAnswer(isCorrect);
      }
    }, text);
    return btn;
  });

  const panel = el('div', { class: 'ra-panel ra-quiz-panel' }, [
    el('p', { class: 'ra-eyebrow' }, `${meta.icon} ${meta.label}`),
    el('h2', { class: 'ra-title', style: 'font-size:1.15rem;line-height:1.4;' }, question.question),
    el('div', { class: 'ra-quiz-answers' }, answerButtons),
    resultLabel,
    factEl,
    continueBtn
  ]);

  return el('div', { class: 'ra-screen' }, panel);
}
