import type {ThemeId} from './data';
// Six-second, silent H.264 clips; frequent keyframes support bidirectional seeking.
export const worldFilms:Record<ThemeId,string|null>={
 conservatory:'/films/scroll/conservatory-moving.mp4',
 gulmohar:'/films/scroll/gulmohar-moving.mp4',
 afterhours:'/films/scroll/afterhours-moving.mp4',
 sunday:'/films/scroll/sunday-moving.mp4',
 azure:'/films/scroll/azure-moving.mp4',
};
export const worldPosters:Record<ThemeId,string>={
 conservatory:'/films/scroll/conservatory-moving-poster.webp',
 gulmohar:'/films/scroll/gulmohar-moving-poster.webp',
 afterhours:'/films/scroll/afterhours-moving-poster.webp',
 sunday:'/films/scroll/sunday-moving-poster.webp',
 azure:'/films/scroll/azure-moving-poster.webp',
};
