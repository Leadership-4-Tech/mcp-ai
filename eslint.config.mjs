import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import _import from 'eslint-plugin-import'
import functional from 'eslint-plugin-functional'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import parser from 'esprima'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      'config.*.mjs',
      'coverage/',
      'dist/',
      'eslint.config.mjs',
      'node_modules/',
      'src/orval/',
      'orval.config.ts',
      'tsconfig.json',
      '.nyc_output/',
      'build/',
      'bin/',
      'features/stepDefinitions',
      'infrastructure/',
      'test/',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'prettier',
      'plugin:import/typescript',
      'plugin:import/recommended',
      'plugin:@typescript-eslint/recommended'
    )
  ),
  {
    plugins: {
      import: fixupPluginRules(_import),
      functional,
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.mocha,
      },
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        project: ['./tsconfig.json'],
      },
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/ignore': ['node_modules'],
      'import/resolver': {
        typescript: true,

        moduleDirectory: ['node_modules', 'src/'],
        node: {
          extensions: ['.ts', '.tsx'],
        },
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      'no-await-in-loop': ['error'],
      'no-console': [
        'error',
        {
          allow: ['warn', 'error', 'info', 'debug'],
        },
      ],
      'no-constant-condition': ['error'],
      'no-extra-parens': 0,
      'no-extra-semi': ['error'],
      'no-loss-of-precision': ['error'],
      'no-promise-executor-return': ['error'],
      'no-template-curly-in-string': ['error'],
      'no-useless-backreference': ['error'],
      'no-unused-vars': 0,
      'require-atomic-updates': ['error'],
      'accessor-pairs': ['error'],
      'array-callback-return': ['error'],
      'block-scoped-var': ['error'],
      'class-methods-use-this': ['error'],
      complexity: ['error'],
      'consistent-return': ['error'],
      curly: ['error'],
      'default-case': ['error'],
      'default-case-last': ['error'],
      'default-param-last': 0,
      'dot-location': ['error', 'property'],
      'dot-notation': ['error'],
      eqeqeq: ['error'],
      'grouped-accessor-pairs': ['error'],
      'guard-for-in': ['error'],
      'max-classes-per-file': ['error'],
      'no-alert': ['error'],
      'no-caller': ['error'],
      'no-constructor-return': ['error'],
      'no-div-regex': ['error'],
      'no-else-return': ['error'],
      'no-empty-function': ['error'],
      'no-eq-null': ['error'],
      'no-eval': ['error'],
      'no-extend-native': ['error'],
      'no-extra-bind': ['error'],
      'no-extra-label': ['error'],
      'no-floating-decimal': ['error'],
      'no-implicit-coercion': ['error'],
      'no-implicit-globals': ['error'],
      'no-implied-eval': ['error'],
      'no-invalid-this': ['error'],
      'no-iterator': ['error'],
      'no-labels': ['error'],
      'no-lone-blocks': ['error'],
      'no-loop-func': ['error'],
      'no-magic-numbers': [
        'error',
        {
          ignore: [1, -1, 0, 2],
        },
      ],
      'no-multi-spaces': ['error'],
      'no-multi-str': ['error'],
      'no-new': ['error'],
      'no-new-func': ['error'],
      'no-new-wrappers': ['error'],
      'no-octal-escape': ['error'],
      'no-proto': ['error'],
      'no-restricted-properties': ['error'],
      'no-return-assign': ['error'],
      'no-return-await': ['error'],
      'no-script-url': ['error'],
      'no-self-compare': ['error'],
      'no-sequences': ['error'],
      'no-throw-literal': ['error'],
      'no-unmodified-loop-condition': ['error'],
      'no-unused-expressions': ['error'],
      'no-useless-call': ['error'],
      'no-useless-concat': ['error'],
      'no-void': ['error'],
      'no-warning-comments': ['warn'],
      'prefer-named-capture-group': ['error'],
      'prefer-promise-reject-errors': 0,
      'prefer-regex-literals': ['error'],
      radix: ['error'],
      'require-unicode-regexp': ['error'],
      'vars-on-top': ['error'],
      'wrap-iife': ['error'],
      yoda: ['error'],
      'arrow-body-style': 0,
      'eol-last': ['error', 'always'],
      'comma-dangle': 0,
      'linebreak-style': 0,
      'no-underscore-dangle': 0,
      'no-unused-labels': 0,
      'object-shorthand': 0,
      'prefer-rest-params': 0,
      semi: ['error', 'never'],
      'functional/immutable-data': [
        'error',
        {
          ignoreAccessorPattern: 'module.exports*',
        },
      ],
      'functional/no-let': ['error'],
      'functional/prefer-property-signatures': ['error'],
      'functional/prefer-readonly-type': 0,
      'functional/prefer-immutable-types': 0,
      'functional/prefer-tacit': ['error'],
      'functional/no-classes': ['error'],
      'functional/no-mixed-type': 0,
      'functional/no-this-expressions': ['error'],
      'functional/no-conditional-statements': 0,
      'functional/no-expression-statement': 0,
      'functional/no-loop-statements': ['error'],
      'functional/no-return-void': 0,
      'functional/no-promise-reject': 0,
      'functional/no-throw-statement': 0,
      'functional/no-try-statements': ['error'],
      'functional/readonly-type': ['error'],
      'functional/functional-parameters': 0,
      'import/no-unresolved': ['error'],
      'import/named': ['error'],
      'import/default': ['error'],
      'import/namespace': ['error'],
      'import/no-restricted-paths': ['error'],
      'import/no-absolute-path': ['error'],
      'import/no-dynamic-require': ['error'],
      'import/no-internal-modules': 0,
      'import/no-webpack-loader-syntax': ['error'],
      'import/no-self-import': ['error'],
      'import/no-cycle': ['error'],
      'import/no-useless-path-segments': ['error'],
      'import/no-relative-parent-imports': 0,
      'import/export': ['error'],
      'import/no-named-as-default': ['error'],
      'import/no-named-as-default-member': ['error'],
      'import/no-deprecated': ['error'],
      'import/no-extraneous-dependencies': ['error'],
      'import/no-mutable-exports': ['error'],
      'import/no-unused-modules': ['error'],
      'import/unambiguous': ['error'],
      'import/no-commonjs': 0,
      'import/no-amd': ['error'],
      'import/no-nodejs-modules': 0,
      'import/first': ['error'],
      'import/exports-last': 0,
      'import/no-duplicates': ['error'],
      'import/no-namespace': 0,
      'import/extensions': ['error'],
      'import/order': ['error'],
      'import/newline-after-import': ['error'],
      'import/prefer-default-export': 0,
      'import/no-unassigned-import': ['error'],
      'import/no-named-default': 0,
      'import/no-named-export': 0,
      'import/no-anonymous-default-export': 0,
      'import/group-exports': 0,
      'import/dynamic-import-chuckname': 0,
    },
  },
  {
    files: ['./src/*.js', './*.js'],
    languageOptions: {
      parser: parser,
      ecmaVersion: 2020,
      sourceType: 'script',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: [],
      },
    },
  },
  {
    files: ['./src/*.ts', './src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'script',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          argsIgnorePattern: '(_+)|(action)',
          args: 'after-used',
          ignoreRestSiblings: false,
        },
      ],
    },
  },
  {
    files: ['./src/orval/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'script',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      'import/max-dependencies': 0,
      'import/order': 0,
    },
  },
]
