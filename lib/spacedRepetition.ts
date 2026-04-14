interface SM2Input {
  ease_factor: number;
  interval_days: number;
  next_review: string;
  in_review_pool: boolean;
}

interface SM2Result {
  ease_factor: number;
  interval_days: number;
  next_review: string;
  in_review_pool: boolean;
}

/**
 * SM-2 spaced repetition algorithm.
 * - Any wrong answer adds the question to the review pool.
 * - A correct answer while in the review pool removes it from the pool.
 */
export function updateSM2(
  current: SM2Input,
  correct: boolean,
): SM2Result {
  let { ease_factor, interval_days } = current;

  if (correct) {
    if (interval_days <= 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.max(1.3, ease_factor + 0.1);
  } else {
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);

  // Any wrong answer → in review pool. Correct answer → removed from pool.
  const in_review_pool = !correct ? true : false;

  return {
    ease_factor,
    interval_days,
    next_review: nextReview.toISOString(),
    in_review_pool,
  };
}