/**
 * Demo flashcards for homepage demonstration
 * 
 * This file contains curated sample flashcards that showcase the variety 
 * and quality of content available in the Ask JDS platform. These cards
 * are used for the homepage demo and load instantly (zero API calls).
 */

export const DEMO_FLASHCARDS = [
  {
    id: 'demo-contracts-1',
    question: 'What constitutes valid consideration in contract formation?',
    answer: 'Valid consideration requires something of legal value exchanged between parties. It must be legally sufficient (not necessarily economically adequate), bargained for, and can include a promise, performance, or forbearance. Past consideration generally doesn\'t count.',
    subject: 'Contracts',
    difficulty: 'intermediate',
    isPremium: false,
    tags: ['formation', 'consideration']
  },
  {
    id: 'demo-torts-1', 
    question: 'What are the elements of negligence?',
    answer: 'The four elements of negligence are: (1) Duty - defendant owed plaintiff a legal duty of care, (2) Breach - defendant breached that duty, (3) Causation - defendant\'s breach was both the factual and proximate cause of plaintiff\'s injury, and (4) Damages - plaintiff suffered actual harm.',
    subject: 'Torts',
    difficulty: 'foundational',
    isPremium: false,
    tags: ['negligence', 'elements']
  },
  {
    id: 'demo-constitutional-1',
    question: 'What is the rational basis test in constitutional law?',
    answer: 'The rational basis test is the most deferential standard of judicial review. A law passes if it is rationally related to a legitimate government interest. The challenger bears the burden of proof, and the law is presumed constitutional. Courts rarely strike down laws under this standard.',
    subject: 'Constitutional Law',
    difficulty: 'intermediate', 
    isPremium: true,
    tags: ['judicial review', 'standards']
  },
  {
    id: 'demo-criminal-1',
    question: 'What is the difference between specific and general intent crimes?',
    answer: 'Specific intent crimes require proof that defendant intended the specific result or acted with a particular purpose (e.g., burglary, assault with intent). General intent crimes only require proof that defendant intended to commit the act itself, not a specific result (e.g., battery, rape).',
    subject: 'Criminal Law',
    difficulty: 'intermediate',
    isPremium: true,
    tags: ['mens rea', 'intent']
  },
  {
    id: 'demo-property-1',
    question: 'What is the Rule Against Perpetuities?',
    answer: 'The Rule Against Perpetuities states that no interest is good unless it must vest, if at all, within 21 years after some life in being at the creation of the interest. It prevents property interests from remaining contingent indefinitely.',
    subject: 'Property Law',
    difficulty: 'advanced',
    isPremium: true,
    tags: ['future interests', 'perpetuities']
  },
  {
    id: 'demo-evidence-1',
    question: 'What is hearsay under the Federal Rules of Evidence?',
    answer: 'Hearsay is an out-of-court statement offered to prove the truth of the matter asserted. Under FRE 801, it includes oral statements, written assertions, and nonverbal conduct intended as an assertion. Hearsay is generally inadmissible unless an exception applies.',
    subject: 'Evidence',
    difficulty: 'foundational',
    isPremium: false,
    tags: ['hearsay', 'FRE']
  },
  {
    id: 'demo-civil-procedure-1',
    question: 'What are the requirements for personal jurisdiction?',
    answer: 'Personal jurisdiction requires: (1) constitutional power (minimum contacts with the forum state such that exercise of jurisdiction doesn\'t offend traditional notions of fair play and substantial justice), and (2) statutory authorization (long-arm statute or general jurisdiction statute).',
    subject: 'Civil Procedure',
    difficulty: 'intermediate',
    isPremium: true,
    tags: ['jurisdiction', 'minimum contacts']
  },
  {
    id: 'demo-business-associations-1',
    question: 'What is the business judgment rule?',
    answer: 'The business judgment rule is a rebuttable presumption that directors acted on an informed basis, in good faith, and in the honest belief that their actions were in the corporation\'s best interests. It protects directors from liability for business decisions that turn out poorly.',
    subject: 'Business Associations',
    difficulty: 'advanced',
    isPremium: true,
    tags: ['corporate law', 'fiduciary duty']
  }
] as const;

/**
 * Type definitions for demo flashcards
 */
export type DemoFlashcard = typeof DEMO_FLASHCARDS[number];

/**
 * Get demo flashcards by subject
 */
export const getDemoFlashcardsBySubject = (subject: string): DemoFlashcard[] => {
  return DEMO_FLASHCARDS.filter(card => card.subject === subject);
};

/**
 * Get demo flashcards by difficulty
 */
export const getDemoFlashcardsByDifficulty = (difficulty: string): DemoFlashcard[] => {
  return DEMO_FLASHCARDS.filter(card => card.difficulty === difficulty);
};

/**
 * Get all available subjects in demo flashcards
 */
export const getDemoSubjects = (): string[] => {
  return Array.from(new Set(DEMO_FLASHCARDS.map(card => card.subject)));
};

/**
 * Get a random selection of demo flashcards
 */
export const getRandomDemoFlashcards = (count: number = 5): DemoFlashcard[] => {
  const shuffled = [...DEMO_FLASHCARDS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}; 