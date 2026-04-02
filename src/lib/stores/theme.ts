import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

function createTheme() {
	const initial: Theme = browser
		? (localStorage.getItem('pm-theme') as Theme) ??
		  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		: 'light';

	const { subscribe, set, update } = writable<Theme>(initial);

	return {
		subscribe,
		toggle() {
			update((t) => {
				const next: Theme = t === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('pm-theme', next);
					document.documentElement.setAttribute('data-theme', next);
				}
				return next;
			});
		},
		init() {
			if (browser) {
				document.documentElement.setAttribute('data-theme', initial);
			}
		}
	};
}

export const theme = createTheme();
