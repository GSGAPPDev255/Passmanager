<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let email = '';
	let password = '';
	let loading = false;
	let error = '';
	let magicLinkSent = false;
	let mode: 'login' | 'signup' = 'login';

	async function handleSubmit() {
		loading = true;
		error = '';

		try {
			if (mode === 'login') {
				const { error: err } = await supabase.auth.signInWithPassword({ email, password });
				if (err) throw err;
				goto('/vault');
			} else {
				const { error: err } = await supabase.auth.signUp({ email, password });
				if (err) throw err;
				error = '';
				mode = 'login';
				alert('Account created! Check your email to confirm, then log in.');
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Authentication failed';
		} finally {
			loading = false;
		}
	}

	async function sendMagicLink() {
		if (!email) { error = 'Enter your email first.'; return; }
		loading = true;
		error = '';
		try {
			const { error: err } = await supabase.auth.signInWithOtp({ email });
			if (err) throw err;
			magicLinkSent = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send magic link';
		} finally {
			loading = false;
		}
	}
</script>

<div class="auth-wrapper">
	<div class="auth-card card">
		<div class="logo">🔑</div>
		<h1>PassManager</h1>
		<p class="tagline">Your encrypted personal vault</p>

		{#if magicLinkSent}
			<div class="magic-sent">
				<p>Magic link sent to <strong>{email}</strong>.</p>
				<p>Check your inbox and click the link to sign in.</p>
				<button class="btn-ghost" on:click={() => (magicLinkSent = false)}>Back</button>
			</div>
		{:else}
			<div class="mode-tabs">
				<button class:active={mode === 'login'} on:click={() => (mode = 'login')}>Log In</button>
				<button class:active={mode === 'signup'} on:click={() => (mode = 'signup')}>Sign Up</button>
			</div>

			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<label for="email">Email</label>
					<input id="email" type="email" bind:value={email} placeholder="you@example.com" required />
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input id="password" type="password" bind:value={password} placeholder="Your password" required autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} />
				</div>

				{#if error}
					<p class="error-msg">{error}</p>
				{/if}

				<button type="submit" class="btn-primary submit-btn" disabled={loading}>
					{#if loading}<span class="spinner"></span>{/if}
					{mode === 'login' ? 'Log In' : 'Create Account'}
				</button>
			</form>

			<div class="divider"><span>or</span></div>

			<button class="btn-ghost magic-btn" on:click={sendMagicLink} disabled={loading}>
				Send Magic Link
			</button>
		{/if}
	</div>
</div>

<style>
	.auth-wrapper {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.auth-card {
		width: 100%;
		max-width: 400px;
		text-align: center;
		padding: 40px 32px;
	}

	.logo {
		font-size: 44px;
		margin-bottom: 8px;
	}

	h1 {
		font-size: 26px;
		margin-bottom: 4px;
	}

	.tagline {
		color: var(--color-text-muted);
		font-size: 14px;
		margin-bottom: 28px;
	}

	.mode-tabs {
		display: flex;
		background: var(--color-bg);
		border-radius: var(--radius-sm);
		padding: 4px;
		margin-bottom: 24px;
		gap: 4px;
	}

	.mode-tabs button {
		flex: 1;
		padding: 8px;
		background: transparent;
		color: var(--color-text-muted);
		border-radius: 4px;
		font-weight: 500;
	}

	.mode-tabs button.active {
		background: var(--color-surface-2);
		color: var(--color-text);
	}

	.submit-btn {
		width: 100%;
		padding: 12px;
		font-size: 15px;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 20px 0;
		color: var(--color-text-faint);
		font-size: 13px;
	}

	.divider::before, .divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}

	.magic-btn {
		width: 100%;
		padding: 10px;
	}

	.magic-sent {
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.magic-sent p {
		color: var(--color-text-muted);
		font-size: 14px;
	}
</style>
