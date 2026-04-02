<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { session, user } from '$lib/stores/auth';
	import { vaultUnlocked, lockVault } from '$lib/stores/masterKey';
	import MasterKeyPrompt from '$lib/components/MasterKeyPrompt.svelte';

	let initialized = false;
	let inactivityTimer: ReturnType<typeof setTimeout>;

	const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

	function resetInactivityTimer() {
		clearTimeout(inactivityTimer);
		inactivityTimer = setTimeout(() => {
			lockVault();
		}, INACTIVITY_MS);
	}

	onMount(() => {
		// Restore session on load
		supabase.auth.getSession().then(({ data }) => {
			session.set(data.session);
			user.set(data.session?.user ?? null);
			initialized = true;
		});

		// Keep session store in sync
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
			session.set(s);
			user.set(s?.user ?? null);

			if (!s) {
				lockVault();
				goto('/auth/login');
			}
		});

		// Inactivity auto-lock
		const events = ['mousemove', 'keydown', 'click', 'touchstart'];
		events.forEach((e) => window.addEventListener(e, resetInactivityTimer, { passive: true }));
		resetInactivityTimer();

		return () => {
			subscription.unsubscribe();
			events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
			clearTimeout(inactivityTimer);
		};
	});

	$: isAuthRoute = $page.url.pathname.startsWith('/auth');
	$: needsUnlock = initialized && $session && !$vaultUnlocked && !isAuthRoute;
</script>

{#if !initialized}
	<div class="init-screen">
		<span class="spinner"></span>
	</div>
{:else}
	<slot />
	{#if needsUnlock}
		<MasterKeyPrompt />
	{/if}
{/if}

<style>
	.init-screen {
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
