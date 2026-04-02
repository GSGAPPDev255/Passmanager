import { writable } from 'svelte/store';
import type { DecryptedEntry } from '$lib/types';

export const vaultEntries = writable<DecryptedEntry[]>([]);
export const vaultLoading = writable(false);
export const vaultError = writable<string | null>(null);
