import { Domain, SubDomain } from './task';

export const DOMAINS: Record<Domain, { name: string; description: string; subDomains: Record<SubDomain, { name: string; description: string; }> }> = {
  'career': {
    name: 'Career & Digital Mastery (Career)',
    description: 'Work, skill development, and professional growth',
    subDomains: {
      education: { name: 'Education', description: 'Learning and studying' },
      professional: { name: 'Professional', description: 'Work and career tasks' },
      financial: { name: 'Financial', description: 'Money management' },
    } as any
  },
  'personal-life': {
    name: 'Life Management & Social (Life)',
    description: 'Daily life, home, and relationships',
    subDomains: {
      household: { name: 'Household', description: 'Home maintenance' },
      'health-fitness': { name: 'Health & Fitness', description: 'Physical wellbeing' },
      'family-relationships': { name: 'Family & Relationships', description: 'Social connections' },
      'social': { name: 'Social', description: 'Events and friends' },
    } as any
  },
  'self-improvement': {
    name: 'Inner Strength & Serenity (Self)',
    description: 'Personal development and mental health',
    subDomains: {
      'personal-growth': { name: 'Personal Growth', description: 'Self-betterment' },
      'spiritual': { name: 'Spiritual', description: 'Mental and spiritual health' },
      'hobbies-leisure': { name: 'Hobbies & Leisure', description: 'Relaxation and fun' },
    } as any
  }
};

export const getDomainFromSubDomain = (subDomain: SubDomain): Domain => {
  if (['education', 'professional', 'financial'].includes(subDomain)) return 'career';
  if (['household', 'health-fitness', 'family-relationships', 'social'].includes(subDomain)) return 'personal-life';
  return 'self-improvement';
};
