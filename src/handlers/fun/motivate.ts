export interface Motivation {
  text: string;
  category: 'quote' | 'tip' | 'affirmation';
  author?: string;
}

const QUOTES: Motivation[] = [
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson", category: 'quote' },
  { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House", category: 'quote' },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck", category: 'quote' },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", category: 'quote' },
  { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", category: 'quote' },
  { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs", category: 'quote' },
  { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson", category: 'quote' },
  { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds", category: 'quote' },
  { text: "The only way to go fast is to go well.", author: "Robert C. Martin", category: 'quote' },
  { text: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry", category: 'quote' },
  { text: "Programming isn't about what you know; it's about what you can figure out.", author: "Chris Pine", category: 'quote' },
  { text: "The most important property of a program is whether it accomplishes the intention of its user.", author: "C.A.R. Hoare", category: 'quote' },
];

const TIPS: Motivation[] = [
  { text: "Take regular breaks. Your brain needs rest to solve complex problems.", category: 'tip' },
  { text: "Write tests before you think you need them.", category: 'tip' },
  { text: "Comment your code for your future self.", category: 'tip' },
  { text: "If you're stuck, try explaining the problem to a rubber duck.", category: 'tip' },
  { text: "Version control is your friend. Commit early, commit often.", category: 'tip' },
  { text: "Don't optimize prematurely. Make it work first.", category: 'tip' },
  { text: "Read error messages carefully. They usually tell you what's wrong.", category: 'tip' },
  { text: "When debugging, check the simple things first.", category: 'tip' },
  { text: "Keep functions small and focused on one thing.", category: 'tip' },
  { text: "Learn your IDE shortcuts. They'll save you hours.", category: 'tip' },
  { text: "Take time to refactor. Technical debt compounds.", category: 'tip' },
  { text: "Code reviews make everyone better. Give and receive feedback graciously.", category: 'tip' },
];

const AFFIRMATIONS: Motivation[] = [
  { text: "You are capable of solving this problem.", category: 'affirmation' },
  { text: "Every expert was once a beginner.", category: 'affirmation' },
  { text: "Bugs are just opportunities to learn.", category: 'affirmation' },
  { text: "Your code doesn't have to be perfect. It just has to work.", category: 'affirmation' },
  { text: "It's okay to ask for help.", category: 'affirmation' },
  { text: "You're making progress, even when it doesn't feel like it.", category: 'affirmation' },
  { text: "Imposter syndrome lies. You belong here.", category: 'affirmation' },
  { text: "Confusion is the first step to understanding.", category: 'affirmation' },
  { text: "You've solved hard problems before. You'll solve this one too.", category: 'affirmation' },
  { text: "Taking breaks is productive, not lazy.", category: 'affirmation' },
  { text: "Your value isn't measured by lines of code.", category: 'affirmation' },
  { text: "Learning new things is supposed to be uncomfortable.", category: 'affirmation' },
];

export function getRandomMotivation(category?: 'quote' | 'tip' | 'affirmation'): Motivation {
  let pool: Motivation[];

  switch (category) {
    case 'quote':
      pool = QUOTES;
      break;
    case 'tip':
      pool = TIPS;
      break;
    case 'affirmation':
      pool = AFFIRMATIONS;
      break;
    default:
      pool = [...QUOTES, ...TIPS, ...AFFIRMATIONS];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getAllMotivations(): { quotes: Motivation[]; tips: Motivation[]; affirmations: Motivation[] } {
  return {
    quotes: QUOTES,
    tips: TIPS,
    affirmations: AFFIRMATIONS,
  };
}
