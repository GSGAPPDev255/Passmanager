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
		if (score <= 1) return { label: 'Weak', pct: 20, color: '#ff4d4d' };
		if (score <= 2) return { label: 'Fair', pct: 45, color: '#ffa040' };
		if (score <= 3) return { label: 'Good', pct: 70, color: '#f0d000' };
		if (score === 4) return { label: 'Strong', pct: 88, color: '#4caf50' };
		return { label: 'Very Strong', pct: 100, color: '#00e676' };
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
		<div class="pw-input-row">
			{#if showPassword}
				<input id="password" type="text" bind:value={password} placeholder="Password" required autocomplete="new-password" />
			{:else}
				<input id="password" type="password" bind:value={password} placeholder="Password" required autocomplete="new-password" />
			{/if}
			<button type="button" class="btn-ghost icon-btn" on:click={() => (showPassword = !showPassword)}>
				{showPassword ? '🙈' : '👁️'}
			</button>
			<button type="button" class="btn-ghost gen-btn" on:click={generatePassword} title="Generate strong password">
				Generate
			</button>
		</div>

		{#if password}
			<div class="strength-bar">
				<div class="strength-fill" style="width:{strength.pct}%; background:{strength.color}"></div>
			</div>
			<span class="strength-label" style="color:{strength.color}">{strength.label}</span>
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
			{entry.id ? 'Save Changes' : 'Add Entry'}
		</button>
	</div>
</form>

<style>
	.pw-input-row {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.pw-input-row input {
		flex: 1;
	}

	.icon-btn {
		padding: 8px 10px;
		flex-shrink: 0;
	}

	.gen-btn {
		flex-shrink: 0;
		white-space: nowrap;
	}

	.strength-bar {
		height: 4px;
		background: var(--color-border);
		border-radius: 2px;
		margin-top: 8px;
		overflow: hidden;
	}

	.strength-fill {
		height: 100%;
		border-radius: 2px;
		transition: width 300ms ease, background 300ms ease;
	}

	.strength-label {
		font-size: 12px;
		display: block;
		margin-top: 4px;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 8px;
	}

	textarea {
		resize: vertical;
	}
</style>
