module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'import'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Prevent direct imports of createClient from @supabase/supabase-js
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@supabase/supabase-js',
            importNames: ['createClient'],
            message: 'Please use the shared Supabase client from @/lib/supabase instead of creating a new client.',
          },
        ],
      },
    ],
    // Allow React imports in JSX files without explicitly importing React
    'react/react-in-jsx-scope': 'off',
  },
  // Don't apply these rules to Supabase Edge Functions or API routes
  overrides: [
    {
      files: [
        'supabase/functions/**/*.ts',
        'supabase/functions/**/*.js',
        'src/api/**/*.ts',
        'src/app/api/**/*.ts',
      ],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
}; 