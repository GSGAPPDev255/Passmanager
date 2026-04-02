import type { EncryptedPayload } from './types';

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 32;
const IV_BYTES = 12;

export function generateSalt(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(SALT_BYTES));
}

export function bufferToBase64(buffer: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function base64ToBuffer(b64: string): ArrayBuffer {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes.buffer;
}

export async function deriveMasterKey(
	masterPassword: string,
	salt: Uint8Array
): Promise<CryptoKey> {
	const passwordBytes = new TextEncoder().encode(masterPassword);

	const baseKey = await crypto.subtle.importKey(
		'raw',
		passwordBytes,
		'PBKDF2',
		false,
		['deriveKey']
	);

	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

export async function encryptEntry(
	masterKey: CryptoKey,
	plaintext: string
): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const encoded = new TextEncoder().encode(plaintext);

	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		masterKey,
		encoded
	);

	const payload: EncryptedPayload = {
		ciphertext: bufferToBase64(ciphertextBuffer),
		iv: bufferToBase64(iv.buffer)
	};

	return JSON.stringify(payload);
}

export async function decryptEntry(
	masterKey: CryptoKey,
	encryptedBlob: string
): Promise<string> {
	const payload: EncryptedPayload = JSON.parse(encryptedBlob);
	const iv = base64ToBuffer(payload.iv);
	const ciphertext = base64ToBuffer(payload.ciphertext);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv },
		masterKey,
		ciphertext
	);

	return new TextDecoder().decode(decryptedBuffer);
}
