<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let siteName: string;
	export let loading = false;

	const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();
</script>

<div class="overlay">
	<div class="dialog">
		<div class="dialog-stripe"></div>
		<div class="dialog-body">
			<div class="warn-icon">⚠️</div>
			<h3>Delete Entry?</h3>
			<p>You're about to permanently delete <strong>{siteName}</strong>. This cannot be undone.</p>
			<div class="actions">
				<button class="btn-ghost" on:click={() => dispatch('cancel')} disabled={loading}>Keep It</button>
				<button class="btn-danger" on:click={() => dispatch('confirm')} disabled={loading}>
					{#if loading}<span class="spinner"></span>{/if}
					Delete →
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 24px;
	}

	.dialog {
		max-width: 380px;
		width: 100%;
		background: var(--white);
		border: var(--border-thick);
		box-shadow: 8px 8px 0px #000;
		overflow: hidden;
	}

	.dialog-stripe {
		height: 8px;
		background: repeating-linear-gradient(
			45deg,
			#FF3131,
			#FF3131 10px,
			#000 10px,
			#000 20px
		);
	}

	.dialog-body {
		padding: 28px 28px 24px;
		text-align: center;
	}

	.warn-icon {
		font-size: 40px;
		margin-bottom: 12px;
	}

	h3 {
		font-size: 20px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: -0.01em;
		margin-bottom: 10px;
	}

	p {
		font-size: 14px;
		font-weight: 500;
		color: #444;
		margin-bottom: 24px;
		line-height: 1.5;
	}

	strong { color: var(--black); font-weight: 700; }

	.actions {
		display: flex;
		justify-content: center;
		gap: 12px;
	}
</style>
