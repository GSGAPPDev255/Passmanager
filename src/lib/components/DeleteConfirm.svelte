<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let siteName: string;
	export let loading = false;

	const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();
</script>

<div class="overlay">
	<div class="dialog card">
		<h3>Delete Entry</h3>
		<p>Are you sure you want to delete <strong>{siteName}</strong>? This cannot be undone.</p>
		<div class="actions">
			<button class="btn-ghost" on:click={() => dispatch('cancel')} disabled={loading}>Cancel</button>
			<button class="btn-danger" on:click={() => dispatch('confirm')} disabled={loading}>
				{#if loading}<span class="spinner"></span>{/if}
				Delete
			</button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		backdrop-filter: blur(2px);
	}

	.dialog {
		max-width: 360px;
		width: 100%;
		padding: 28px 24px;
	}

	h3 {
		font-size: 18px;
		margin-bottom: 12px;
	}

	p {
		color: var(--color-text-muted);
		font-size: 14px;
		margin-bottom: 24px;
	}

	strong {
		color: var(--color-text);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}
</style>
