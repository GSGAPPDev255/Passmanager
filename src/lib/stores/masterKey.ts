import { writable, derived } from 'svelte/store';
import { vaultEntries } from './vault';

export const masterKey = writable<CryptoKey | null>(null);
export const vaultUnlocked = derived(masterKey, ($k) => $k !== null);

export function lockVault() {
	masterKey.set(null);
	vaultEntries.set([]); // Clear decrypted entries from memory on lock
}
