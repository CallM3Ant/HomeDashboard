// Mastery state machine:
//
// NORMAL (not in review, not mastered):
//   correct → correct_streak++; if streak >= 3 → MASTERED
//   wrong   → in_review_pool = true, streak = 0, review_correct = 0
//
// REVIEW (in_review_pool):
//   correct → review_correct++; if review_correct >= 2 → exit review (NORMAL, streak=0)
//   wrong   → review_correct = 0 (stay in review)
//
// MASTERED:
//   correct → stays mastered, extends interval
//   wrong   → in_review_pool = true, mastered = false (back to REVIEW)

export interface SM2Input {
  ease_factor: number;
  interval_days: number;
  next_review: string;
  in_review_pool: boolean;
  mastered?: boolean;
  correct_streak?: number;
  review_correct_count?: number;
}

export interface SM2Result {
  ease_factor: number;
  interval_days: number;
  next_review: string;
  in_review_pool: boolean;
  mastered: boolean;
  correct_streak: number;
  review_correct_count: number;
}

export function updateSM2(current: SM2Input, correct: boolean): SM2Result {
  let { ease_factor, interval_days } = current;
  let in_review_pool = current.in_review_pool ?? false;
  let mastered = current.mastered ?? false;
  let correct_streak = current.correct_streak ?? 0;
  let review_correct_count = current.review_correct_count ?? 0;

  if (in_review_pool) {
    if (correct) {
      review_correct_count++;
      ease_factor = Math.max(1.3, ease_factor + 0.05);
      if (review_correct_count >= 2) {
        // Exit review pool — reset, need 3 correct to master again
        in_review_pool = false;
        review_correct_count = 0;
        correct_streak = 0;
        interval_days = 1;
      } else {
        interval_days = 1;
      }
    } else {
      review_correct_count = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    }
  } else if (mastered) {
    if (correct) {
      interval_days = Math.round(interval_days * ease_factor);
      ease_factor = Math.max(1.3, ease_factor + 0.05);
    } else {
      // Forgot a mastered card — back to review
      in_review_pool = true;
      mastered = false;
      correct_streak = 0;
      review_correct_count = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    }
  } else {
    // Normal state — working toward mastery
    if (correct) {
      correct_streak++;
      ease_factor = Math.max(1.3, ease_factor + 0.1);
      if (correct_streak >= 3) {
        mastered = true;
        interval_days = interval_days <= 1 ? 6 : Math.round(interval_days * ease_factor);
      } else {
        interval_days = interval_days <= 1 ? 6 : Math.round(interval_days * ease_factor);
      }
    } else {
      in_review_pool = true;
      correct_streak = 0;
      review_correct_count = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval_days);

  return {
    ease_factor,
    interval_days,
    next_review: nextReview.toISOString(),
    in_review_pool,
    mastered,
    correct_streak,
    review_correct_count,
  };
}