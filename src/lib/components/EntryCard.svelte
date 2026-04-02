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
		} catch { return null; }
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

	// Assign a color per card based on site name
	const colors = ['#FFE500', '#0047FF', '#FF3131', '#00C853', '#7B2FFF', '#FF6B00'];
	$: accentColor = colors[entry.site_name.charCodeAt(0) % colors.length];
</script>

<div class="entry-card">
	<div class="card-accent" style="background:{accentColor}"></div>

	<div class="card-body">
		<div class="card-header">
			<div class="site-info">
				{#if favicon}
					<img src={favicon} alt="" class="favicon" width="22" height="22" />
				{:else}
					<div class="favicon-placeholder" style="background:{accentColor}">
						{entry.site_name[0]?.toUpperCase() ?? '?'}
					</div>
				{/if}
				<div class="site-name-wrap">
					<div class="site-name">{entry.site_name}</div>
					{#if entry.url}
						<a href={entry.url} target="_blank" rel="noopener noreferrer" class="site-url">{entry.url}</a>
					{/if}
				</div>
			</div>

			<div class="card-actions">
				<button class="icon-btn edit-btn" title="Edit" on:click={() => dispatch('edit', entry)}>✏️</button>
				<button class="icon-btn del-btn" title="Delete" on:click={() => dispatch('delete', entry)}>🗑️</button>
			</div>
		</div>

		<div class="fields">
			<div class="field">
				<span class="field-label">User</span>
				<span class="field-val">{entry.username}</span>
			</div>

			<div class="field">
				<span class="field-label">Pass</span>
				<div class="pw-row">
					<span class="field-val pw-val">
						{showPassword ? entry.password : '••••••••••••'}
					</span>
					<button class="icon-btn" on:click={() => (showPassword = !showPassword)}>
						{showPassword ? '🙈' : '👁️'}
					</button>
					<button class="icon-btn copy-btn" class:copied on:click={copyPassword}>
						{copied ? '✅' : '📋'}
					</button>
				</div>
			</div>

			{#if entry.notes}
				<div class="field">
					<span class="field-label">Note</span>
					<span class="field-val notes-val">{entry.notes}</span>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.entry-card {
		background: var(--surface);
		border: var(--border-thick);
		box-shadow: var(--shadow);
		display: flex;
		flex-direction: column;
		transition: transform var(--transition), box-shadow var(--transition);
		position: relative;
	}

	.entry-card:hover {
		transform: translate(-3px, -3px);
		box-shadow: var(--shadow-lg);
	}

	.card-accent {
		height: 6px;
		border-bottom: var(--border);
	}

	.card-body {
		padding: 18px 20px;
	}

	.card-header {
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
		border: 2px solid #000;
		flex-shrink: 0;
	}

	.favicon-placeholder {
		width: 30px;
		height: 30px;
		border: var(--border);
		font-weight: 700;
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.site-name-wrap { min-width: 0; }

	.site-name {
		font-weight: 700;
		font-size: 15px;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.site-url {
		font-size: 11px;
		color: #777;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		text-decoration: none;
		font-weight: 500;
	}

	.site-url:hover { text-decoration: underline; }

	.card-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}

	.icon-btn {
		padding: 5px 8px;
		font-size: 13px;
		border: var(--border);
		background: var(--field-bg);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		font-family: inherit;
		font-weight: 700;
		transition: transform var(--transition), box-shadow var(--transition);
	}

	.icon-btn:hover {
		transform: translate(-2px, -2px);
		box-shadow: var(--shadow);
	}

	.icon-btn:active {
		transform: translate(1px, 1px);
		box-shadow: none;
	}

	.del-btn:hover { background: color-mix(in srgb, var(--red) 15%, var(--surface)); }

	.fields { display: flex; flex-direction: column; gap: 10px; }

	.field {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 10px;
		border: 2px solid var(--border-color);
		background: var(--field-bg);
	}

	.field-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #666;
		width: 34px;
		flex-shrink: 0;
		padding-top: 1px;
	}

	.field-val {
		font-size: 13px;
		font-weight: 600;
		word-break: break-all;
		flex: 1;
	}

	.pw-row {
		display: flex;
		align-items: center;
		gap: 5px;
		flex: 1;
	}

	.pw-val {
		font-family: monospace;
		font-size: 13px;
		flex: 1;
		letter-spacing: 0.05em;
	}

	.notes-val {
		font-size: 12px;
		color: #555;
		white-space: pre-wrap;
		font-weight: 500;
	}

	.copied { background: color-mix(in srgb, var(--green) 15%, var(--surface)); }
</style>
