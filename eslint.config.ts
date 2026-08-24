import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

export default defineConfigWithVueTs(
  {
    name: 'carshare/ignores',
    ignores: ['dist/**', 'dev-dist/**', 'coverage/**', 'node_modules/**']
  },

  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'carshare/browser-globals',
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser
    }
  },

  {
    name: 'carshare/rules',
    rules: {
      // Every view is a route target ("Profile", "Login"); requiring
      // multi-word names here would only produce `ProfilePage` noise.
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Deliberate no-ops: storage access is wrapped in try/catch precisely
      // because a blocked localStorage must not take the app down.
      'no-empty': ['error', { allowEmptyCatch: true }]
    }
  }
)
