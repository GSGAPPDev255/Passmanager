<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { masterKey } from '$lib/stores/masterKey';
	import { user } from '$lib/stores/auth';
	import { deriveMasterKey, generateSalt, bufferToBase64, base64ToBuffer } from '$lib/crypto';

	let password = '';
	let loading = false;
	let error = '';

	async function unlock() {
		if (!password || !$user) return;
		loading = true;
		error = '';

		try {
			// Check if user already has a salt stored
			const { data: meta } = await supabase
				.from('user_key_metadata')
				.select('pbkdf2_salt, iterations')
				.eq('user_id', $user.id)
				.single();

			let salt: Uint8Array;

			if (meta) {
				salt = new Uint8Array(base64ToBuffer(meta.pbkdf2_salt) as ArrayBuffer);
			} else {
				// First time — generate and store a new salt
				salt = generateSalt();
				const { error: insertErr } = await supabase
					.from('user_key_metadata')
					.insert({
						user_id: $user.id,
						pbkdf2_salt: bufferToBase64(salt.buffer),
						iterations: 600000
					});
				if (insertErr) throw insertErr;
			}

			const key = await deriveMasterKey(password, salt);
			masterKey.set(key);
			password = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to unlock vault';
		} finally {
			loading = false;
		}
	}
</script>

<div class="overlay">
	<div class="prompt card">
		<div class="lock-icon">🔐</div>
		<h2>Unlock Your Vault</h2>
		<p class="subtitle">Enter your master password to decrypt your entries.</p>

		<form on:submit|preventDefault={unlock}>
			<div class="form-group">
				<label for="master-pw">Master Password</label>
				<input
					id="master-pw"
					type="password"
					bind:value={password}
					placeholder="Enter master password"
					autocomplete="current-password"
					disabled={loading}
				/>
			</div>

			{#if error}
				<p class="error-msg">{error}</p>
			{/if}

			<button type="submit" class="btn-primary unlock-btn" disabled={loading || !password}>
				{#if loading}
					<span class="spinner"></span> Deriving key…
				{:else}
					Unlock Vault
				{/if}
			</button>
		</form>

		<p class="hint">Your master password never leaves this device.</p>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(4px);
	}

	.prompt {
		width: 100%;
		max-width: 400px;
		text-align: center;
		padding: 36px 32px;
	}

	.lock-icon {
		font-size: 40px;
		margin-bottom: 12px;
	}

	h2 {
		font-size: 22px;
		margin-bottom: 8px;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 14px;
		margin-bottom: 24px;
	}

	.unlock-btn {
		width: 100%;
		padding: 12px;
		font-size: 15px;
		margin-top: 4px;
	}

	.hint {
		margin-top: 20px;
		font-size: 12px;
		color: var(--color-text-faint);
	}
</style>
