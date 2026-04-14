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
 * Updates review schedule based on whether the user answered correctly.
 */
export function updateSM2(
  current: SM2Input,
  correct: boolean,
  reviewThreshold: number,
  incorrectCount: number
): SM2Result {
  let { ease_factor, interval_days } = current;

  if (correct) {
    // Progress through the standard SM-2 intervals
    if (interval_days <= 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.max(1.3, ease_factor + 0.1);
  } else {
    // Reset on incorrect answer
    interval_days = 1;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);

  // Put in review pool if the user has missed enough times
  const in_review_pool = incorrectCount >= reviewThreshold;

  return {
    ease_factor,
    interval_days,
    next_review: nextReview.toISOString(),
    in_review_pool,
  };
}