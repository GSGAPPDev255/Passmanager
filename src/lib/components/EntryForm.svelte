<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DecryptedEntry } from '$lib/types';

	export let entry: Partial<DecryptedEntry> = {};
	export let loading = false;
	export let error = '';

	const dispatch = createEventDispatcher<{ save: Partial<DecryptedEntry>; cancel: void }>();

	let site_name = entry.site_name ?? '';
	let username = entry.username ?? '';
	let password = entry.password ?? '';
	let url = entry.url ?? '';
	let notes = entry.notes ?? '';
	let showPassword = false;

	function generatePassword() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
		const arr = crypto.getRandomValues(new Uint8Array(24));
		password = Array.from(arr, (b) => chars[b % chars.length]).join('');
		showPassword = true;
	}

	function getStrength(pw: string): { label: string; pct: number; color: string } {
		if (!pw) return { label: '', pct: 0, color: 'transparent' };
		let score = 0;
		if (pw.length >= 12) score++;
		if (pw.length >= 20) score++;
		if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
		if (/\d/.test(pw)) score++;
		if (/[^a-zA-Z0-9]/.test(pw)) score++;
		if (score <= 1) return { label: 'Weak', pct: 20, color: '#FF3131' };
		if (score <= 2) return { label: 'Fair', pct: 45, color: '#FF6B00' };
		if (score <= 3) return { label: 'Good', pct: 70, color: '#FFE500' };
		if (score === 4) return { label: 'Strong', pct: 88, color: '#00C853' };
		return { label: 'Very Strong', pct: 100, color: '#0047FF' };
	}

	$: strength = getStrength(password);

	function submit() {
		dispatch('save', { site_name, username, password, url: url || null, notes: notes || null });
	}
</script>

<form on:submit|preventDefault={submit}>
	<div class="form-group">
		<label for="site-name">Site Name *</label>
		<input id="site-name" type="text" bind:value={site_name} placeholder="e.g. GitHub" required />
	</div>

	<div class="form-group">
		<label for="username">Username / Email *</label>
		<input id="username" type="text" bind:value={username} placeholder="user@example.com" required autocomplete="off" />
	</div>

	<div class="form-group">
		<label for="password">Password *</label>
		<div class="pw-row">
			{#if showPassword}
				<input id="password" type="text" bind:value={password} placeholder="Password" required autocomplete="new-password" />
			{:else}
				<input id="password" type="password" bind:value={password} placeholder="Password" required autocomplete="new-password" />
			{/if}
			<button type="button" class="icon-btn" on:click={() => (showPassword = !showPassword)}>
				{showPassword ? '🙈' : '👁️'}
			</button>
			<button type="button" class="gen-btn" on:click={generatePassword}>Generate</button>
		</div>

		{#if password}
			<div class="strength-bar">
				<div class="strength-fill" style="width:{strength.pct}%; background:{strength.color}; border-right: {strength.pct < 100 ? '2px solid #000' : 'none'}"></div>
			</div>
			<span class="strength-label" style="color:{strength.color === '#FFE500' ? '#886600' : strength.color}">{strength.label}</span>
		{/if}
	</div>

	<div class="form-group">
		<label for="url">URL</label>
		<input id="url" type="url" bind:value={url} placeholder="https://github.com" />
	</div>

	<div class="form-group">
		<label for="notes">Notes</label>
		<textarea id="notes" bind:value={notes} placeholder="Optional notes…" rows="3"></textarea>
	</div>

	{#if error}
		<p class="error-msg">{error}</p>
	{/if}

	<div class="form-actions">
		<button type="button" class="btn-ghost" on:click={() => dispatch('cancel')}>Cancel</button>
		<button type="submit" class="btn-primary" disabled={loading}>
			{#if loading}<span class="spinner"></span>{/if}
			{entry.id ? 'Save Changes →' : 'Add Entry →'}
		</button>
	</div>
</form>

<style>
	.pw-row {
		display: flex;
		gap: 6px;
		align-items: stretch;
	}

	.pw-row input { flex: 1; }

	.icon-btn {
		padding: 8px 10px;
		flex-shrink: 0;
		border: var(--border);
		background: var(--field-bg);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		font-family: inherit;
		font-weight: 700;
		font-size: 13px;
		transition: transform var(--transition), box-shadow var(--transition);
	}

	.icon-btn:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow);
	}

	.gen-btn {
		flex-shrink: 0;
		border: var(--border);
		background: var(--blue);
		color: var(--white);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		font-family: inherit;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0 12px;
		transition: transform var(--transition), box-shadow var(--transition);
	}

	.gen-btn:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow);
	}

	.strength-bar {
		height: 6px;
		background: var(--field-bg);
		border: 2px solid var(--border-color);
		margin-top: 8px;
		overflow: hidden;
	}

	.strength-fill {
		height: 100%;
		transition: width 250ms ease, background 250ms ease;
	}

	.strength-label {
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		display: block;
		margin-top: 4px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 8px;
		padding-top: 12px;
		border-top: 3px solid var(--border-color);
	}

	textarea { resize: vertical; }
</style>
