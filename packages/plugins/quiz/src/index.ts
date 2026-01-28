// Zammy Plugin: Quiz
// Test your developer knowledge with interactive quizzes

import type { PluginAPI, ZammyPlugin } from 'zammy/plugins';

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

interface Category {
  name: string;
  questions: Question[];
}

// ============ QUESTION BANK ============

const CATEGORIES: Record<string, Category> = {
  git: {
    name: 'Git',
    questions: [
      {
        question: 'What command creates a new branch and switches to it?',
        options: ['git branch new', 'git checkout -b new', 'git switch new', 'git create new'],
        answer: 1,
        explanation: 'git checkout -b creates and switches in one command',
      },
      {
        question: 'How do you stage all modified files?',
        options: ['git stage .', 'git add -A', 'git commit -a', 'git push --all'],
        answer: 1,
        explanation: 'git add -A stages all changes including deletions',
      },
      {
        question: 'What does "git stash" do?',
        options: ['Deletes changes', 'Commits changes', 'Temporarily saves changes', 'Pushes changes'],
        answer: 2,
        explanation: 'Stash saves uncommitted changes without committing',
      },
      {
        question: 'How do you undo the last commit but keep changes?',
        options: ['git revert HEAD', 'git reset --soft HEAD~1', 'git checkout HEAD~1', 'git undo'],
        answer: 1,
        explanation: '--soft keeps changes staged, --hard discards them',
      },
      {
        question: 'What is a "detached HEAD" state?',
        options: ['Corrupted repository', 'Checked out a specific commit', 'Lost connection', 'Merge conflict'],
        answer: 1,
        explanation: 'You\'re on a commit, not a branch',
      },
    ],
  },
  http: {
    name: 'HTTP',
    questions: [
      {
        question: 'What HTTP status code means "Not Found"?',
        options: ['400', '401', '404', '500'],
        answer: 2,
        explanation: '404 means the requested resource doesn\'t exist',
      },
      {
        question: 'Which HTTP method is idempotent?',
        options: ['POST', 'PUT', 'PATCH', 'None'],
        answer: 1,
        explanation: 'PUT is idempotent - same request gives same result',
      },
      {
        question: 'What does a 301 status code mean?',
        options: ['Bad Request', 'Moved Permanently', 'Unauthorized', 'Server Error'],
        answer: 1,
        explanation: '301 is a permanent redirect',
      },
      {
        question: 'Which header is used for CORS?',
        options: ['X-Requested-With', 'Content-Type', 'Access-Control-Allow-Origin', 'Authorization'],
        answer: 2,
        explanation: 'CORS headers control cross-origin requests',
      },
      {
        question: 'What is the maximum URL length recommended?',
        options: ['256 chars', '2048 chars', '8192 chars', 'No limit'],
        answer: 1,
        explanation: '2048 chars is safe for most browsers',
      },
    ],
  },
  js: {
    name: 'JavaScript',
    questions: [
      {
        question: 'What is the result of typeof null?',
        options: ['"null"', '"undefined"', '"object"', '"boolean"'],
        answer: 2,
        explanation: 'This is a famous JavaScript bug from the early days',
      },
      {
        question: 'What does "use strict" do?',
        options: ['Makes code faster', 'Enables strict mode', 'Disables console', 'Enables TypeScript'],
        answer: 1,
        explanation: 'Strict mode catches common coding mistakes',
      },
      {
        question: 'What is a closure?',
        options: ['A loop', 'Function with access to outer scope', 'A class', 'An error handler'],
        answer: 1,
        explanation: 'Closures remember their lexical scope',
      },
      {
        question: 'What is the event loop?',
        options: ['A for loop', 'Handles async operations', 'DOM events only', 'A debugging tool'],
        answer: 1,
        explanation: 'Event loop manages async code execution',
      },
      {
        question: 'What does "===" check?',
        options: ['Value only', 'Type only', 'Value and type', 'Reference'],
        answer: 2,
        explanation: '=== is strict equality (no type coercion)',
      },
    ],
  },
  regex: {
    name: 'Regex',
    questions: [
      {
        question: 'What does "^" match at the start of a regex?',
        options: ['Any character', 'Start of string', 'End of string', 'Caret literal'],
        answer: 1,
        explanation: '^ anchors to the start of the string',
      },
      {
        question: 'What does "\\d" match?',
        options: ['Any letter', 'Any digit', 'Any whitespace', 'The letter d'],
        answer: 1,
        explanation: '\\d is shorthand for [0-9]',
      },
      {
        question: 'What does "+" mean in regex?',
        options: ['Zero or more', 'One or more', 'Exactly one', 'Optional'],
        answer: 1,
        explanation: '+ matches one or more occurrences',
      },
      {
        question: 'What does ".*" match?',
        options: ['Literal .*', 'Any characters (greedy)', 'Nothing', 'One character'],
        answer: 1,
        explanation: '.* matches any characters greedily',
      },
      {
        question: 'What flag makes regex case-insensitive?',
        options: ['g', 'i', 'm', 's'],
        answer: 1,
        explanation: 'i flag ignores case',
      },
    ],
  },
};

// ============ QUIZ STATE ============

interface QuizState {
  category: string;
  currentQuestion: number;
  score: number;
  total: number;
  questions: Question[];
}

let currentQuiz: QuizState | null = null;

// ============ STORAGE ============

interface Stats {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  categoryStats: Record<string, { correct: number; total: number }>;
  streak: number;
  bestStreak: number;
}

function getDefaultStats(): Stats {
  return {
    totalQuizzes: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    categoryStats: {},
    streak: 0,
    bestStreak: 0,
  };
}

// ============ PLUGIN ============

const plugin: ZammyPlugin = {
  activate(api: PluginAPI) {
    const { theme, symbols } = api.ui;

    function shuffle<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }

    function showCategories(): void {
      console.log('');
      console.log(`  ${symbols.sparkles} ${theme.gradient('DEVELOPER QUIZ')}`);
      console.log('');
      console.log(`  ${theme.dim('Test your knowledge!')}`);
      console.log('');
      console.log(`  ${theme.secondary('Categories:')}`);
      for (const [key, cat] of Object.entries(CATEGORIES)) {
        console.log(`    ${theme.primary(key.padEnd(10))} ${theme.dim(cat.name)} ${theme.dim(`(${cat.questions.length} questions)`)}`);
      }
      console.log('');
      console.log(`  ${theme.dim('Usage:')}`);
      console.log(`    ${theme.primary('/quiz start <category>')}  ${theme.dim('Start a quiz')}`);
      console.log(`    ${theme.primary('/quiz stats')}             ${theme.dim('View your stats')}`);
      console.log(`    ${theme.primary('/quiz daily')}             ${theme.dim('Daily challenge')}`);
      console.log('');
    }

    function startQuiz(category: string): void {
      const cat = CATEGORIES[category.toLowerCase()];
      if (!cat) {
        console.log(`  ${symbols.cross} ${theme.error(`Unknown category: ${category}`)}`);
        console.log(`  ${theme.dim('Available:')} ${Object.keys(CATEGORIES).join(', ')}`);
        return;
      }

      const questions = shuffle(cat.questions).slice(0, 5);
      currentQuiz = {
        category: category.toLowerCase(),
        currentQuestion: 0,
        score: 0,
        total: questions.length,
        questions,
      };

      console.log('');
      console.log(`  ${symbols.sparkles} ${theme.gradient(`${cat.name} Quiz`)}`);
      console.log(`  ${theme.dim(`${questions.length} questions`)}`);
      console.log('');

      showQuestion();
    }

    function showQuestion(): void {
      if (!currentQuiz) return;

      const q = currentQuiz.questions[currentQuiz.currentQuestion];
      const num = currentQuiz.currentQuestion + 1;
      const total = currentQuiz.total;

      console.log(`  ${theme.secondary(`Question ${num}/${total}`)}`);
      console.log('');
      console.log(`  ${theme.primary(q.question)}`);
      console.log('');

      q.options.forEach((opt, i) => {
        console.log(`    ${theme.accent(`${i + 1}.`)} ${opt}`);
      });

      console.log('');
      console.log(`  ${theme.dim('Answer with:')} /quiz answer <1-4>`);
      console.log('');
    }

    function submitAnswer(answerStr: string): void {
      if (!currentQuiz) {
        console.log(`  ${symbols.warning} ${theme.warning('No quiz in progress. Start one with /quiz start <category>')}`);
        return;
      }

      const answer = parseInt(answerStr, 10) - 1;
      const q = currentQuiz.questions[currentQuiz.currentQuestion];

      if (isNaN(answer) || answer < 0 || answer >= q.options.length) {
        console.log(`  ${symbols.cross} ${theme.error('Invalid answer. Enter 1-4')}`);
        return;
      }

      console.log('');

      if (answer === q.answer) {
        currentQuiz.score++;
        console.log(`  ${symbols.check} ${theme.success('Correct!')}`);
      } else {
        console.log(`  ${symbols.cross} ${theme.error('Wrong!')}`);
        console.log(`  ${theme.dim('Correct answer:')} ${q.options[q.answer]}`);
      }

      if (q.explanation) {
        console.log(`  ${theme.dim('Explanation:')} ${q.explanation}`);
      }

      console.log('');

      currentQuiz.currentQuestion++;

      if (currentQuiz.currentQuestion >= currentQuiz.total) {
        finishQuiz();
      } else {
        showQuestion();
      }
    }

    function finishQuiz(): void {
      if (!currentQuiz) return;

      const { score, total, category } = currentQuiz;
      const percent = Math.round((score / total) * 100);

      console.log(`  ${theme.secondary('═'.repeat(30))}`);
      console.log('');
      console.log(`  ${symbols.sparkles} ${theme.gradient('Quiz Complete!')}`);
      console.log('');
      console.log(`  ${theme.primary('Score:')} ${score}/${total} (${percent}%)`);
      console.log('');

      if (percent === 100) {
        console.log(`  ${symbols.star} ${theme.success('Perfect score!')}`);
      } else if (percent >= 80) {
        console.log(`  ${symbols.check} ${theme.success('Great job!')}`);
      } else if (percent >= 60) {
        console.log(`  ${symbols.info} ${theme.warning('Not bad!')}`);
      } else {
        console.log(`  ${symbols.info} ${theme.dim('Keep practicing!')}`);
      }

      console.log('');

      // Save stats
      const stats = api.storage.get<Stats>('stats') || getDefaultStats();
      stats.totalQuizzes++;
      stats.totalCorrect += score;
      stats.totalQuestions += total;

      if (!stats.categoryStats[category]) {
        stats.categoryStats[category] = { correct: 0, total: 0 };
      }
      stats.categoryStats[category].correct += score;
      stats.categoryStats[category].total += total;

      if (percent === 100) {
        stats.streak++;
        if (stats.streak > stats.bestStreak) {
          stats.bestStreak = stats.streak;
        }
      } else {
        stats.streak = 0;
      }

      api.storage.set('stats', stats);

      currentQuiz = null;
    }

    function showStats(): void {
      const stats = api.storage.get<Stats>('stats') || getDefaultStats();

      console.log('');
      console.log(`  ${symbols.sparkles} ${theme.gradient('Quiz Stats')}`);
      console.log('');

      if (stats.totalQuizzes === 0) {
        console.log(`  ${theme.dim('No quizzes completed yet!')}`);
        console.log(`  ${theme.dim('Start one with /quiz start <category>')}`);
        console.log('');
        return;
      }

      const avgPercent = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);

      console.log(`  ${theme.primary('Total Quizzes:')}    ${stats.totalQuizzes}`);
      console.log(`  ${theme.primary('Questions:')}        ${stats.totalCorrect}/${stats.totalQuestions} (${avgPercent}%)`);
      console.log(`  ${theme.primary('Current Streak:')}   ${stats.streak}`);
      console.log(`  ${theme.primary('Best Streak:')}      ${stats.bestStreak}`);
      console.log('');
      console.log(`  ${theme.secondary('By Category:')}`);

      for (const [cat, catStats] of Object.entries(stats.categoryStats)) {
        const catPercent = Math.round((catStats.correct / catStats.total) * 100);
        console.log(`    ${theme.dim(cat.padEnd(10))} ${catStats.correct}/${catStats.total} (${catPercent}%)`);
      }

      console.log('');
    }

    function dailyChallenge(): void {
      // Use date as seed for consistent daily category
      const today = new Date().toISOString().split('T')[0];
      const categories = Object.keys(CATEGORIES);
      const index = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % categories.length;
      const category = categories[index];

      console.log(`  ${symbols.star} ${theme.gradient('Daily Challenge')}`);
      console.log(`  ${theme.dim(`Today's category: ${CATEGORIES[category].name}`)}`);
      console.log('');

      startQuiz(category);
    }

    api.registerCommand({
      name: 'quiz',
      description: 'Test your developer knowledge',
      usage: '/quiz [start <category>|answer <1-4>|stats|daily]',
      async execute(args: string[]) {
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
          showCategories();
          return;
        }

        switch (subcommand) {
          case 'start':
            if (!args[1]) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage: /quiz start <category>')}`);
              console.log(`  ${theme.dim('Categories:')} ${Object.keys(CATEGORIES).join(', ')}`);
            } else {
              startQuiz(args[1]);
            }
            break;

          case 'answer':
          case 'a':
            if (!args[1]) {
              console.log(`  ${symbols.warning} ${theme.warning('Usage: /quiz answer <1-4>')}`);
            } else {
              submitAnswer(args[1]);
            }
            break;

          case 'stats':
            showStats();
            break;

          case 'daily':
            dailyChallenge();
            break;

          case 'skip':
            if (currentQuiz) {
              currentQuiz.currentQuestion++;
              if (currentQuiz.currentQuestion >= currentQuiz.total) {
                finishQuiz();
              } else {
                showQuestion();
              }
            }
            break;

          case 'quit':
          case 'exit':
            if (currentQuiz) {
              currentQuiz = null;
              console.log(`  ${theme.dim('Quiz abandoned.')}`);
            }
            break;

          default:
            // Maybe it's a category shortcut
            if (CATEGORIES[subcommand]) {
              startQuiz(subcommand);
            } else {
              showCategories();
            }
        }
      },
    });

    api.log.info('Quiz plugin activated');
  },
};

export default plugin;
