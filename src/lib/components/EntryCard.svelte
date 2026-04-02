<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { DecryptedEntry } from '$lib/types';

	export let entry: DecryptedEntry;

	const dispatch = createEventDispatcher<{ edit: DecryptedEntry; delete: DecryptedEntry }>();

	let showPassword = false;
	let copied = false;
	let copyTimeout: ReturnType<typeof setTimeout>;

	function getFavicon(url: string | null): string | null {
		if (!url) return null;
		try {
			const u = new URL(url.startsWith('http') ? url : `https://${url}`);
			return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
		} catch {
			return null;
		}
	}

	async function copyPassword() {
		await navigator.clipboard.writeText(entry.password);
		copied = true;
		clearTimeout(copyTimeout);
		copyTimeout = setTimeout(async () => {
			copied = false;
			await navigator.clipboard.writeText('');
		}, 30_000);
	}

	$: favicon = getFavicon(entry.url);
</script>

<div class="entry-card card">
	<div class="entry-header">
		<div class="site-info">
			{#if favicon}
				<img src={favicon} alt="" class="favicon" width="20" height="20" />
			{:else}
				<div class="favicon-placeholder">{entry.site_name[0]?.toUpperCase() ?? '?'}</div>
			{/if}
			<div>
				<div class="site-name">{entry.site_name}</div>
				{#if entry.url}
					<a href={entry.url} target="_blank" rel="noopener noreferrer" class="site-url">{entry.url}</a>
				{/if}
			</div>
		</div>
		<div class="actions">
			<button class="btn-ghost icon-btn" title="Edit" on:click={() => dispatch('edit', entry)}>
				✏️
			</button>
			<button class="btn-ghost icon-btn danger-btn" title="Delete" on:click={() => dispatch('delete', entry)}>
				🗑️
			</button>
		</div>
	</div>

	<div class="entry-fields">
		<div class="field-row">
			<span class="field-label">Username</span>
			<span class="field-value">{entry.username}</span>
		</div>

		<div class="field-row">
			<span class="field-label">Password</span>
			<div class="password-row">
				<span class="field-value password-val">
					{showPassword ? entry.password : '••••••••••••'}
				</span>
				<button class="btn-ghost icon-btn small" on:click={() => (showPassword = !showPassword)}>
					{showPassword ? '🙈' : '👁️'}
				</button>
				<button class="btn-ghost icon-btn small copy-btn" class:copied on:click={copyPassword}>
					{copied ? '✅' : '📋'}
				</button>
			</div>
		</div>

		{#if entry.notes}
			<div class="field-row">
				<span class="field-label">Notes</span>
				<span class="field-value notes">{entry.notes}</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.entry-card {
		transition: border-color 150ms ease;
	}

	.entry-card:hover {
		border-color: var(--color-primary);
	}

	.entry-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 16px;
		gap: 8px;
	}

	.site-info {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.favicon {
		border-radius: 4px;
		flex-shrink: 0;
	}

	.favicon-placeholder {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.site-name {
		font-weight: 600;
		font-size: 15px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.site-url {
		font-size: 12px;
		color: var(--color-text-faint);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.icon-btn {
		padding: 6px 8px;
		font-size: 14px;
		line-height: 1;
	}

	.danger-btn:hover {
		background: rgba(255, 77, 77, 0.15);
		border-color: var(--color-danger);
	}

	.entry-fields {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.field-row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.field-label {
		font-size: 12px;
		color: var(--color-text-faint);
		width: 72px;
		flex-shrink: 0;
		padding-top: 2px;
	}

	.field-value {
		font-size: 14px;
		color: var(--color-text);
		word-break: break-all;
	}

	.password-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
	}

	.password-val {
		flex: 1;
		font-family: monospace;
		letter-spacing: 0.05em;
	}

	.small {
		padding: 4px 6px;
		font-size: 13px;
	}

	.notes {
		color: var(--color-text-muted);
		font-size: 13px;
		white-space: pre-wrap;
	}
</style>
