// @ts-nocheck - config ESM .mjs; tsconfig do projeto não cobre esModuleInterop/import.meta
import eslint from '@eslint/js';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.json'],
      },
    },
  },
  {
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-expressions': [
        'error',
        {
          allowShortCircuit: false,
          allowTernary: false,
          allowTaggedTemplates: false,
          enforceForJSX: false,
          ignoreDirectives: false,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Proibir console.* (usar Logger/StandardLogger)
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Ordenação de imports
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      // Complexidade e tamanho
      complexity: ['warn', 15],
      'max-lines-per-function': [
        'warn',
        { max: 120, skipBlankLines: true, skipComments: true },
      ],
      'max-lines': [
        'warn',
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      'no-debugger': 'error',
      // Configurações para compatibilidade com Prettier
      'prettier/prettier': [
        'error',
        {
          semi: true,
          trailingComma: 'es5',
          singleQuote: true,
          printWidth: 80,
          tabWidth: 2,
          useTabs: false,
          bracketSpacing: true,
          bracketSameLine: false,
          arrowParens: 'avoid',
          endOfLine: 'lf',
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  }
);
