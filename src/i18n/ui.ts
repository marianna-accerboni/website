export const languages = {
  en: 'English',
  it: 'Italiano'
} as const;

export type Locale = keyof typeof languages;

export const defaultLocale: Locale = 'en';

export const ui = {
  en: {
    'site.title': 'Marianna Accerboni',
    'nav.home': 'Home',
    'nav.exhibitions': 'Exhibitions',
    'home.comingExhibitions': 'Coming exhibitions',
    'home.latestExhibitions': 'Latest exhibitions',
    'exhibition.artists': 'Artists',
    'exhibition.venue': 'Venue',
    'exhibition.dates': 'Dates',
    'exhibition.from': 'From',
    'exhibition.to': 'to',
    'exhibition.attachments': 'Attachments',
    'exhibition.gallery': 'Gallery',
    'exhibition.video': 'Video',
    'exhibition.backToList': 'Back to exhibitions',
    'exhibition.noUpcoming': 'No upcoming exhibitions at the moment.',
    'footer.rights': 'All rights reserved.'
  },
  it: {
    'site.title': 'Marianna Accerboni',
    'nav.home': 'Home',
    'nav.exhibitions': 'Mostre',
    'home.comingExhibitions': 'Prossime mostre',
    'home.latestExhibitions': 'Ultime mostre',
    'exhibition.artists': 'Artisti',
    'exhibition.venue': 'Sede',
    'exhibition.dates': 'Date',
    'exhibition.from': 'Dal',
    'exhibition.to': 'al',
    'exhibition.attachments': 'Allegati',
    'exhibition.gallery': 'Galleria',
    'exhibition.video': 'Video',
    'exhibition.backToList': 'Torna alle mostre',
    'exhibition.noUpcoming': 'Nessuna mostra in programma al momento.',
    'footer.rights': 'Tutti i diritti riservati.'
  }
} as const;

export type UiKey = keyof (typeof ui)['en'];

export function useTranslations(locale: Locale) {
  return function t(key: UiKey): string {
    return ui[locale][key] ?? ui[defaultLocale][key];
  };
}
