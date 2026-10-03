import { fr, type LandingStrings, type FaqItem } from './landing.fr';
import { ar } from './landing.ar';

export type LandingLocale = 'fr' | 'ar';

export const landingStrings: Record<LandingLocale, LandingStrings> = { fr, ar };

export type { LandingStrings, FaqItem };
