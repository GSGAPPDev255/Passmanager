<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	onMount(async () => {
		// Supabase JS handles the token from the URL hash automatically
		const { data } = await supabase.auth.getSession();
		if (data.session) {
			goto('/vault');
		} else {
			goto('/auth/login');
		}
	});
</script>

<div class="callback-screen">
	<span class="spinner"></span>
	<p>Signing you in…</p>
</div>

<style>
	.callback-screen {
		height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		color: var(--color-text-muted);
	}
</style>
