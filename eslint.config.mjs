import js from '@eslint/js';
import globals from 'globals';
export default [
  {
    ignores: [
      'node_modules/**',
      '_next/**',
      'assets/dist/**',
      'assets/catalog-slices/**',
      'assets/cm-common.js',
      'assets/cm-form-state.js',
      'assets/translations/**',
      'assets/merchant-i18n/**',
      'assets/legacy-models/**',
      'assets/cm-home-copy-v3.js',
      'assets/cm-catalog-v3.js',
      'assets/cm-ui-copy.js',
      'assets/cm-legacy-copy.js',
      'assets/cm-keypad-copy.js',
      'assets/cm-intent-schema.js',
      'assets/cm-translation-index.js',
    ],
  },
  js.configs.recommended,
  {
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
  {
    files: ['assets/cm-merchant-model-v2.js'],
    languageOptions: { globals: { module: 'readonly' } },
  },
  {
    files: ['scripts/decision-engine-browser-test.mjs'],
    languageOptions: { globals: { document: 'readonly' } },
  },
  {
    files: ['assets/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        CMModels: 'readonly',
        CMCalendar: 'readonly',
        CMCoreFinance: 'readonly',
        CMUnits: 'readonly',
        CMKeypad: 'readonly',
        CMData: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none', varsIgnorePattern: '^CM' },
      ],
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }] },
  },
];
