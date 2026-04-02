import { writable, derived } from 'svelte/store';

export const masterKey = writable<CryptoKey | null>(null);
export const vaultUnlocked = derived(masterKey, ($k) => $k !== null);

export function lockVault() {
	masterKey.set(null);
}
