import nextPlugin from 'eslint-config-next'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', '.vercel/**', 'coverage/**'],
  },
  ...nextPlugin,
]

export default eslintConfig
