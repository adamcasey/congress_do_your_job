import { AboutContent } from '@/components/about/AboutContent'

export const metadata = {
  title: 'About - Congress Do Your Job',
  description:
    'Learn how Congress Do Your Job delivers a calm, nonpartisan view of congressional work and promotes respectful civic outreach.',
}

const principles = [
  {
    title: 'Clarity over noise',
    description: 'We translate legislative activity into plain English and point to primary sources.',
  },
  {
    title: 'Respectful outreach',
    description: 'We encourage direct, specific messages that assume good faith and focus on outcomes.',
  },
  {
    title: 'Accountability with context',
    description: 'Progress is shown alongside deadlines and follow-ups, not just headlines.',
  },
]

export default function AboutPage() {
  return <AboutContent />
}
