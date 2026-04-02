<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { masterKey } from '$lib/stores/masterKey';
	import { vaultEntries, vaultLoading, vaultError } from '$lib/stores/vault';
	import { user } from '$lib/stores/auth';
	import { decryptEntry, encryptEntry } from '$lib/crypto';
	import EntryCard from '$lib/components/EntryCard.svelte';
	import EntryForm from '$lib/components/EntryForm.svelte';
	import DeleteConfirm from '$lib/components/DeleteConfirm.svelte';
	import { theme } from '$lib/stores/theme';
	import type { DecryptedEntry, VaultEntry } from '$lib/types';

	let search = '';
	let showAddModal = false;
	let editingEntry: DecryptedEntry | null = null;
	let deletingEntry: DecryptedEntry | null = null;
	let formLoading = false;
	let formError = '';
	let deleteLoading = false;

	async function loadVault() {
		if (!$masterKey || !$user) return;
		vaultLoading.set(true);
		vaultError.set(null);

		const { data, error } = await supabase
			.from('vault_entries')
			.select('*')
			.order('site_name', { ascending: true });

		if (error) {
			vaultError.set(error.message);
			vaultLoading.set(false);
			return;
		}

		const decrypted: DecryptedEntry[] = [];
		for (const row of (data as VaultEntry[])) {
			try {
				const pw = await decryptEntry($masterKey!, row.encrypted_blob);
				decrypted.push({
					id: row.id,
					site_name: row.site_name,
					username: row.username,
					url: row.url,
					notes: row.notes,
					password: pw
				});
			} catch {
				// Skip entries that fail to decrypt
			}
		}

		vaultEntries.set(decrypted);
		vaultLoading.set(false);
	}

	onMount(() => { loadVault(); });
	$: if ($masterKey) loadVault();

	async function handleSave(event: CustomEvent<Partial<DecryptedEntry>>) {
		if (!$masterKey || !$user) return;
		formLoading = true;
		formError = '';
		const data = event.detail;

		try {
			const encrypted_blob = await encryptEntry($masterKey, data.password ?? '');
			const row = {
				user_id: $user.id,
				site_name: data.site_name!,
				username: data.username!,
				url: data.url ?? null,
				notes: data.notes ?? null,
				encrypted_blob
			};

			if (editingEntry) {
				const { error } = await supabase.from('vault_entries').update(row).eq('id', editingEntry.id);
				if (error) throw error;
			} else {
				const { error } = await supabase.from('vault_entries').insert(row);
				if (error) throw error;
			}

			showAddModal = false;
			editingEntry = null;
			await loadVault();
		} catch (e) {
			formError = e instanceof Error ? e.message : 'Failed to save entry';
		} finally {
			formLoading = false;
		}
	}

	async function handleDelete() {
		if (!deletingEntry) return;
		deleteLoading = true;
		const { error } = await supabase.from('vault_entries').delete().eq('id', deletingEntry.id);
		if (!error) { deletingEntry = null; await loadVault(); }
		deleteLoading = false;
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/auth/login');
	}

	$: filtered = $vaultEntries.filter(e =>
		e.site_name.toLowerCase().includes(search.toLowerCase()) ||
		e.username.toLowerCase().includes(search.toLowerCase())
	);
</script>

<div class="vault-layout">

	<!-- Header -->
	<header class="vault-header">
		<div class="header-left">
			<div class="header-logo">🔑</div>
			<span class="header-title">PassManager</span>
			<span class="tag">{$vaultEntries.length} entries</span>
		</div>
		<div class="header-right">
			<span class="user-email">{$user?.email}</span>
			<button class="theme-toggle btn-ghost" on:click={theme.toggle} title="Toggle dark mode">
				{$theme === 'dark' ? '☀️' : '🌙'}
			</button>
			<button class="btn-ghost signout-btn" on:click={signOut}>Sign Out</button>
		</div>
	</header>

	<main class="vault-main">

		<!-- Toolbar -->
		<div class="toolbar">
			<div class="search-wrap">
				<span class="search-icon">⌕</span>
				<input type="search" placeholder="Search entries…" bind:value={search} class="search-input" />
			</div>
			<button class="btn-primary add-btn" on:click={() => (showAddModal = true)}>
				+ New Entry
			</button>
		</div>

		<!-- States -->
		{#if $vaultLoading}
			<div class="state-box"><span class="spinner"></span> Loading vault…</div>
		{:else if $vaultError}
			<div class="state-box error-msg">{$vaultError}</div>
		{:else if $vaultEntries.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🗄️</div>
				<p class="empty-title">Your vault is empty</p>
				<p class="empty-sub">Add your first password entry to get started.</p>
				<button class="btn-primary" on:click={() => (showAddModal = true)}>+ Add First Entry</button>
			</div>
		{:else if filtered.length === 0}
			<div class="state-box">No entries match "<strong>{search}</strong>"</div>
		{:else}
			<div class="entries-grid">
				{#each filtered as entry (entry.id)}
					<EntryCard
						{entry}
						on:edit={(e) => { editingEntry = e.detail; showAddModal = true; }}
						on:delete={(e) => (deletingEntry = e.detail)}
					/>
				{/each}
			</div>
		{/if}
	</main>
</div>

<!-- Modal -->
{#if showAddModal || editingEntry}
	<div class="modal-overlay"
		role="presentation"
		on:click|self={() => { showAddModal = false; editingEntry = null; }}
		on:keydown|self={(e) => { if (e.key === 'Escape') { showAddModal = false; editingEntry = null; } }}>
		<div class="modal card">
			<div class="modal-header">
				<h2>{editingEntry ? '✏️ Edit Entry' : '➕ New Entry'}</h2>
				<button class="close-btn btn-ghost" on:click={() => { showAddModal = false; editingEntry = null; }}>✕</button>
			</div>
			<EntryForm
				entry={editingEntry ?? {}}
				loading={formLoading}
				error={formError}
				on:save={handleSave}
				on:cancel={() => { showAddModal = false; editingEntry = null; formError = ''; }}
			/>
		</div>
	</div>
{/if}

{#if deletingEntry}
	<DeleteConfirm
		siteName={deletingEntry.site_name}
		loading={deleteLoading}
		on:confirm={handleDelete}
		on:cancel={() => (deletingEntry = null)}
	/>
{/if}

<style>
	.vault-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	/* Header */
	.vault-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 28px;
		background: var(--header-bg);
		border-bottom: var(--border-thick);
		box-shadow: 0 4px 0 var(--border-color);
		position: sticky;
		top: 0;
		z-index: 10;
		gap: 12px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.header-logo {
		font-size: 24px;
		width: 40px;
		height: 40px;
		background: var(--white);
		border: var(--border);
		box-shadow: var(--shadow-sm);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.header-title {
		font-size: 18px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		color: var(--header-text);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-email {
		font-size: 12px;
		font-weight: 700;
		color: #333;
		text-transform: none;
	}

	.theme-toggle {
		padding: 6px 10px;
		font-size: 16px;
	}

	.signout-btn {
		font-size: 12px;
		padding: 6px 12px;
	}

	/* Main */
	.vault-main {
		flex: 1;
		padding: 28px;
		max-width: 1140px;
		width: 100%;
		margin: 0 auto;
	}

	/* Toolbar */
	.toolbar {
		display: flex;
		gap: 12px;
		margin-bottom: 28px;
	}

	.search-wrap {
		flex: 1;
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 14px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 18px;
		pointer-events: none;
		font-weight: 700;
	}

	.search-input {
		padding-left: 40px;
		font-size: 15px;
	}

	.add-btn {
		white-space: nowrap;
		padding: 10px 20px;
		font-size: 14px;
	}

	/* Grid */
	.entries-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
		gap: 20px;
	}

	/* States */
	.state-box {
		text-align: center;
		padding: 60px 24px;
		font-weight: 600;
		border: var(--border);
		background: var(--surface);
		box-shadow: var(--shadow);
	}

	.empty-state {
		text-align: center;
		padding: 80px 24px;
		border: var(--border-thick);
		background: var(--surface);
		box-shadow: var(--shadow-lg);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.empty-icon { font-size: 56px; }

	.empty-title {
		font-size: 22px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.empty-sub {
		font-size: 14px;
		color: #555;
		margin-bottom: 8px;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 150;
		padding: 24px;
	}

	.modal {
		width: 100%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		background: var(--surface);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}

	.modal-header h2 {
		font-size: 18px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.close-btn {
		padding: 4px 10px;
		font-size: 16px;
	}
</style>
