import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['public/**'],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ['src/tests/**/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
