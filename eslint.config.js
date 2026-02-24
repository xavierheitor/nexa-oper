const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');
const pluginImport = require('eslint-plugin-import');
const pluginReact = require('eslint-plugin-react');
const pluginJsxA11y = require('eslint-plugin-jsx-a11y');
const pluginSonarjs = require('eslint-plugin-sonarjs');
const pluginUnicorn = require('eslint-plugin-unicorn');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,

  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'out/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/out/**',
      '**/generated/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'turbo.json',
      'package.json',
      'package-lock.json',
    ],
  },

  // TypeScript configuration
  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.base.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },

  // Rules configuration
  {
    plugins: {
      import: pluginImport,
      react: pluginReact,
      'jsx-a11y': pluginJsxA11y,
      sonarjs: pluginSonarjs,
      unicorn: pluginUnicorn,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // General rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-expressions': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-template': 'error',
      'template-curly-spacing': 'error',
      'object-shorthand': 'error',
      'array-callback-return': 'error',
      'consistent-return': 'error',
      'default-case': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-unsafe-finally': 'error',
      'no-unsafe-negation': 'error',
      'no-unsafe-optional-chaining': 'error',
      'no-useless-backreference': 'error',
      'no-useless-catch': 'error',
      'no-useless-escape': 'error',
      'no-void': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'error',
      yoda: 'error',

      // Import rules
      'import/no-unresolved': 'off', // Handled by TypeScript
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'off', // Can be noisy in monorepos

      // React specific rules (for Next.js)
      'react/jsx-uses-react': 'off', // Not needed in React 17+
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript instead
      'react/jsx-props-no-spreading': 'off',
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': [
        'error',
        { extensions: ['.tsx', '.jsx'] },
      ],

      // Accessibility
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',

      // Code quality
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/prefer-immediate-return': 'off',
      'sonarjs/no-identical-functions': 'error',

      // Unicorn rules
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/expiring-todo-comments': 'off',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-array-instanceof': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-hex-escape': 'error',
      'unicorn/no-new-buffer': 'error',
      'unicorn/no-process-exit': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-unsafe-regex': 'error',
      'unicorn/no-unused-properties': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-math-trunc': 'error',
      'unicorn/prefer-modern-dom-apis': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-prototype-methods': 'error',
      'unicorn/prefer-query-selector': 'error',
      'unicorn/prefer-reflect-apply': 'error',
      'unicorn/prefer-regexp-test': 'error',
      'unicorn/prefer-set-has': 'error',
      'unicorn/prefer-spread': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-string-trim-start-end': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error',
    },
  }
);
