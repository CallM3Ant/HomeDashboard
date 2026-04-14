import { getDb } from './db';
import crypto from 'crypto';

export function seedDatabase(): { seeded: boolean; message: string } {
  const db = getDb();

  // Only seed if empty
  const existing = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (existing.count > 0) {
    return { seeded: false, message: 'Database already has content' };
  }

  const insertCat = db.prepare(
    'INSERT INTO categories (id, name, parent_id, path, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const insertQ = db.prepare(
    'INSERT INTO questions (id, category_id, text, type, correct, incorrect, difficulty, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const seed = db.transaction(() => {
    // ── Mathematics ──────────────────────────────────────────────────────────
    const mathId = crypto.randomUUID();
    insertCat.run(mathId, 'Mathematics', null, 'mathematics', 0);

    const algebraId = crypto.randomUUID();
    insertCat.run(algebraId, 'Algebra', mathId, 'mathematics/algebra', 0);

    const calcId = crypto.randomUUID();
    insertCat.run(calcId, 'Calculus', mathId, 'mathematics/calculus', 1);

    insertQ.run(
      crypto.randomUUID(), algebraId,
      'What is the quadratic formula?', 'single',
      JSON.stringify(['x = (-b ± √(b²−4ac)) / 2a']),
      JSON.stringify(['x = (-b ± √(b²+4ac)) / 2a', 'x = (b ± √(b²−4ac)) / 2a', 'x = (-b ± √(b²−4ac)) / a']),
      2, JSON.stringify(['formula', 'quadratic'])
    );

    insertQ.run(
      crypto.randomUUID(), algebraId,
      'Solve for x: 2x + 6 = 14', 'single',
      JSON.stringify(['x = 4']),
      JSON.stringify(['x = 3', 'x = 5', 'x = 10']),
      1, JSON.stringify(['linear equations'])
    );

    insertQ.run(
      crypto.randomUUID(), algebraId,
      'Which of the following are properties of a linear function?', 'multiple',
      JSON.stringify(['Constant rate of change', 'Graph is a straight line']),
      JSON.stringify(['Graph is a parabola', 'Has an exponential growth rate']),
      1, JSON.stringify(['linear functions'])
    );

    insertQ.run(
      crypto.randomUUID(), calcId,
      'What is the derivative of x²?', 'single',
      JSON.stringify(['2x']),
      JSON.stringify(['x', '2', 'x²']),
      1, JSON.stringify(['derivatives', 'power rule'])
    );

    insertQ.run(
      crypto.randomUUID(), calcId,
      'What is ∫2x dx?', 'single',
      JSON.stringify(['x² + C']),
      JSON.stringify(['2x² + C', 'x + C', '2 + C']),
      2, JSON.stringify(['integrals'])
    );

    // ── Science ───────────────────────────────────────────────────────────────
    const sciId = crypto.randomUUID();
    insertCat.run(sciId, 'Science', null, 'science', 1);

    const physId = crypto.randomUUID();
    insertCat.run(physId, 'Physics', sciId, 'science/physics', 0);

    const chemId = crypto.randomUUID();
    insertCat.run(chemId, 'Chemistry', sciId, 'science/chemistry', 1);

    insertQ.run(
      crypto.randomUUID(), physId,
      "State Newton's Second Law of Motion.", 'single',
      JSON.stringify(['F = ma']),
      JSON.stringify(['F = mv', 'E = mc²', 'p = mv']),
      1, JSON.stringify(['Newton', 'forces'])
    );

    insertQ.run(
      crypto.randomUUID(), physId,
      'What is the approximate speed of light in a vacuum?', 'single',
      JSON.stringify(['3 × 10⁸ m/s']),
      JSON.stringify(['3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s']),
      1, JSON.stringify(['constants', 'light'])
    );

    insertQ.run(
      crypto.randomUUID(), chemId,
      'What is the chemical formula for water?', 'single',
      JSON.stringify(['H₂O']),
      JSON.stringify(['HO₂', 'H₂O₂', 'OH']),
      1, JSON.stringify(['formulas', 'water'])
    );

    insertQ.run(
      crypto.randomUUID(), chemId,
      'Which of the following are noble gases?', 'multiple',
      JSON.stringify(['Helium (He)', 'Neon (Ne)', 'Argon (Ar)']),
      JSON.stringify(['Oxygen (O)', 'Nitrogen (N)', 'Hydrogen (H)']),
      2, JSON.stringify(['noble gases', 'periodic table'])
    );

    // ── History ───────────────────────────────────────────────────────────────
    const histId = crypto.randomUUID();
    insertCat.run(histId, 'History', null, 'history', 2);

    insertQ.run(
      crypto.randomUUID(), histId,
      'In what year did World War II end?', 'single',
      JSON.stringify(['1945']),
      JSON.stringify(['1943', '1944', '1946']),
      1, JSON.stringify(['WWII', 'dates'])
    );

    insertQ.run(
      crypto.randomUUID(), histId,
      'Who was the first President of the United States?', 'single',
      JSON.stringify(['George Washington']),
      JSON.stringify(['Thomas Jefferson', 'John Adams', 'Benjamin Franklin']),
      1, JSON.stringify(['US Presidents'])
    );

    insertQ.run(
      crypto.randomUUID(), histId,
      'Which of the following were Allied powers in World War II?', 'multiple',
      JSON.stringify(['United States', 'United Kingdom', 'Soviet Union']),
      JSON.stringify(['Germany', 'Japan', 'Italy']),
      2, JSON.stringify(['WWII', 'Allies'])
    );
  });

  seed();

  return { seeded: true, message: 'Starter content loaded! Explore the categories to begin studying.' };
}