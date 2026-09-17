import {createContext} from 'react';
import type {ThemeId} from './data';

export type FilmFormat = 'mobile' | 'web';
export const OpeningFilmActive = createContext(false);
export function openingFormat(): FilmFormat {
  return window.matchMedia('(min-width: 701px)').matches ? 'web' : 'mobile';
}
export function configuredFilm(theme: ThemeId, format: FilmFormat = openingFormat()): string {
  return `/films/openers/${format}/${theme}.mp4`;
}
export function openingPoster(theme: ThemeId, format: FilmFormat): string {
  return `/films/openers/${format}/${theme}-poster.webp`;
}
