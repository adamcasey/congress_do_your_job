import { Lato, Prata } from 'next/font/google'

export const freePressFont = Prata({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal'],
})

export const latoFont = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
})
