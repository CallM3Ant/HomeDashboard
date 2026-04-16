export interface QuestionDef {
  q: string;
  a: string | string[];
  wrong?: string[];
  type?: 'single' | 'multiple';
}

// Must be an interface (not type alias) for self-referential recursive types
export interface ContentTree {
  [category: string]: ContentTree | QuestionDef[];
}

export const content: ContentTree = {
  Mathematics: {
    Algebra: [
      {
        q: 'What is the quadratic formula?',
        a: 'x = (-b ± √(b²−4ac)) / 2a',
        wrong: [
          'x = (-b ± √(b²+4ac)) / 2a',
          'x = (b ± √(b²−4ac)) / 2a',
          'x = (-b ± √(b²−4ac)) / a',
        ],
      },
      {
        q: 'Solve for x: 2x + 6 = 14',
        a: 'x = 4',
        wrong: ['x = 3', 'x = 5', 'x = 10'],
      },
      {
        q: 'Which of the following are properties of a linear function?',
        type: 'multiple',
        a: ['Constant rate of change', 'Graph is a straight line'],
        wrong: ['Graph is a parabola', 'Has an exponential growth rate'],
      },
    ],
    Calculus: [
      {
        q: 'What is the derivative of x²?',
        a: '2x',
        wrong: ['x', '2', 'x²'],
      },
      {
        q: 'What is ∫2x dx?',
        a: 'x² + C',
        wrong: ['2x² + C', 'x + C', '2 + C'],
      },
    ],
  },
  Science: {
    Physics: [
      {
        q: "State Newton's Second Law of Motion.",
        a: 'F = ma',
        wrong: ['F = mv', 'E = mc²', 'p = mv'],
      },
    ],
    Chemistry: [
      {
        q: 'What is the chemical formula for water?',
        a: 'H₂O',
        wrong: ['HO₂', 'H₂O₂', 'OH'],
      },
    ],
  },
  History: [
    {
      q: 'In what year did World War II end?',
      a: '1945',
      wrong: ['1943', '1944', '1946'],
    },
    {
      q: 'Who was the first President of the United States?',
      a: 'George Washington',
      wrong: ['Thomas Jefferson', 'John Adams', 'Benjamin Franklin'],
    },
  ],
};