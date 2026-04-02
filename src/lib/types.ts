export interface VaultEntry {
	id: string;
	user_id: string;
	site_name: string;
	username: string;
	url: string | null;
	notes: string | null;
	encrypted_blob: string;
	created_at: string;
	updated_at: string;
}

export interface DecryptedEntry {
	id: string;
	site_name: string;
	username: string;
	url: string | null;
	notes: string | null;
	password: string;
}

export interface EncryptedPayload {
	ciphertext: string;
	iv: string;
}
