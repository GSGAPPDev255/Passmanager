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
				// Skip entries that fail to decrypt (wrong key)
			}
		}

		vaultEntries.set(decrypted);
		vaultLoading.set(false);
	}

	onMount(() => {
		loadVault();
	});

	// Reload when master key becomes available
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
				const { error } = await supabase
					.from('vault_entries')
					.update(row)
					.eq('id', editingEntry.id);
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
		if (!error) {
			deletingEntry = null;
			await loadVault();
		}
		deleteLoading = false;
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/auth/login');
	}

	$: filtered = $vaultEntries.filter(
		(e) =>
			e.site_name.toLowerCase().includes(search.toLowerCase()) ||
			e.username.toLowerCase().includes(search.toLowerCase())
	);
</script>

<div class="vault-layout">
	<header class="vault-header">
		<div class="header-left">
			<span class="logo-icon">🔑</span>
			<span class="logo-text">PassManager</span>
		</div>
		<div class="header-right">
			<span class="user-email">{$user?.email}</span>
			<button class="btn-ghost" on:click={signOut}>Sign Out</button>
		</div>
	</header>

	<main class="vault-main">
		<div class="toolbar">
			<div class="search-wrap">
				<span class="search-icon">🔍</span>
				<input
					type="search"
					placeholder="Search entries…"
					bind:value={search}
					class="search-input"
				/>
			</div>
			<button class="btn-primary add-btn" on:click={() => (showAddModal = true)}>
				+ Add Entry
			</button>
		</div>

		{#if $vaultLoading}
			<div class="state-msg"><span class="spinner"></span> Loading vault…</div>
		{:else if $vaultError}
			<div class="state-msg error-msg">{$vaultError}</div>
		{:else if $vaultEntries.length === 0}
			<div class="empty-state">
				<div class="empty-icon">🗄️</div>
				<p>Your vault is empty.</p>
				<button class="btn-primary" on:click={() => (showAddModal = true)}>Add your first entry</button>
			</div>
		{:else if filtered.length === 0}
			<div class="state-msg">No entries match "<strong>{search}</strong>"</div>
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

<!-- Add / Edit Modal -->
{#if showAddModal || editingEntry}
	<div class="modal-overlay" role="presentation" on:click|self={() => { showAddModal = false; editingEntry = null; }} on:keydown|self={(e) => { if (e.key === 'Escape') { showAddModal = false; editingEntry = null; } }}>
		<div class="modal card">
			<h2>{editingEntry ? 'Edit Entry' : 'Add Entry'}</h2>
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

<!-- Delete Confirm -->
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
	}

	.vault-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 24px;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 17px;
	}

	.logo-icon { font-size: 22px; }

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.user-email {
		font-size: 13px;
		color: var(--color-text-muted);
	}

	.vault-main {
		flex: 1;
		padding: 28px 24px;
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
	}

	.toolbar {
		display: flex;
		gap: 12px;
		margin-bottom: 24px;
	}

	.search-wrap {
		flex: 1;
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 14px;
		pointer-events: none;
	}

	.search-input {
		padding-left: 36px;
	}

	.add-btn {
		white-space: nowrap;
		padding: 10px 18px;
	}

	.entries-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 16px;
	}

	.state-msg {
		text-align: center;
		padding: 60px 24px;
		color: var(--color-text-muted);
	}

	.empty-state {
		text-align: center;
		padding: 80px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.empty-icon { font-size: 48px; }

	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 150;
		padding: 24px;
		backdrop-filter: blur(2px);
	}

	.modal {
		width: 100%;
		max-width: 480px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal h2 {
		font-size: 18px;
		margin-bottom: 20px;
	}
</style>
