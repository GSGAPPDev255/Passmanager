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
			const { data: meta } = await supabase
				.from('user_key_metadata')
				.select('pbkdf2_salt, iterations')
				.eq('user_id', $user.id)
				.single();

			let salt: Uint8Array;

			if (meta) {
				salt = new Uint8Array(base64ToBuffer(meta.pbkdf2_salt) as ArrayBuffer);
			} else {
				salt = generateSalt();
				const { error: insertErr } = await supabase
					.from('user_key_metadata')
					.insert({ user_id: $user.id, pbkdf2_salt: bufferToBase64(salt.buffer), iterations: 600000 });
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
	<div class="prompt">

		<div class="prompt-header">
			<div class="lock-box">🔐</div>
			<div>
				<h2>Vault Locked</h2>
				<p class="sub">Enter master password to decrypt</p>
			</div>
		</div>

		<form on:submit|preventDefault={unlock}>
			<div class="form-group">
				<label for="master-pw">Master Password</label>
				<input
					id="master-pw"
					type="password"
					bind:value={password}
					placeholder="Enter master password…"
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
					Unlock Vault →
				{/if}
			</button>
		</form>

		<p class="hint">⚡ Your password never leaves this device</p>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 24px;
	}

	.prompt {
		width: 100%;
		max-width: 400px;
		background: var(--white);
		border: var(--border-thick);
		box-shadow: 8px 8px 0px #000;
		padding: 36px 32px;
	}

	.prompt-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 28px;
	}

	.lock-box {
		width: 56px;
		height: 56px;
		background: var(--yellow);
		border: var(--border);
		box-shadow: var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
		flex-shrink: 0;
	}

	h2 {
		font-size: 20px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.01em;
	}

	.sub {
		font-size: 12px;
		font-weight: 600;
		color: #555;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-top: 2px;
	}

	.unlock-btn {
		width: 100%;
		padding: 14px;
		font-size: 15px;
		margin-top: 4px;
	}

	.hint {
		margin-top: 20px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
		text-align: center;
	}
</style>
