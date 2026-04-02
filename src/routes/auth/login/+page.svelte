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

	<!-- decorative blobs -->
	<div class="blob blob-1"></div>
	<div class="blob blob-2"></div>

	<div class="auth-card card">

		<div class="logo-row">
			<div class="logo-box">🔑</div>
			<div>
				<h1>PassManager</h1>
				<p class="tagline">Zero-knowledge vault</p>
			</div>
		</div>

		{#if magicLinkSent}
			<div class="magic-sent">
				<div class="sent-icon">📬</div>
				<p class="sent-title">Check your inbox!</p>
				<p class="sent-sub">Magic link sent to <strong>{email}</strong>. Click it to sign in instantly — no password needed.</p>
				<button class="btn-ghost" on:click={() => (magicLinkSent = false)}>← Back</button>
			</div>
		{:else}
			<div class="mode-tabs">
				<button class:active={mode === 'login'} on:click={() => { mode = 'login'; error = ''; }}>Log In</button>
				<button class:active={mode === 'signup'} on:click={() => { mode = 'signup'; error = ''; }}>Sign Up</button>
			</div>

			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<label for="email">Email</label>
					<input id="email" type="email" bind:value={email} placeholder="you@example.com" required />
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input id="password" type="password" bind:value={password} placeholder="••••••••••" required
						autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} />
				</div>

				{#if error}
					<p class="error-msg">{error}</p>
				{/if}

				<button type="submit" class="btn-primary submit-btn" disabled={loading}>
					{#if loading}<span class="spinner"></span>{/if}
					{mode === 'login' ? 'Log In →' : 'Create Account →'}
				</button>
			</form>

			<div class="divider"><span>or skip the password</span></div>

			<button class="magic-btn" on:click={sendMagicLink} disabled={loading}>
				✉️ Send Magic Link
			</button>
		{/if}
	</div>

	<p class="footer-note">Passwords encrypted on your device. We never see them.</p>
</div>

<style>
	.auth-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px;
		position: relative;
		overflow: hidden;
	}

	.blob {
		position: fixed;
		border-radius: 50%;
		z-index: 0;
		border: 3px solid #000;
	}

	.blob-1 {
		width: 340px;
		height: 340px;
		background: #FFE500;
		top: -100px;
		right: -80px;
	}

	.blob-2 {
		width: 220px;
		height: 220px;
		background: #0047FF;
		bottom: -60px;
		left: -60px;
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		position: relative;
		z-index: 1;
		padding: 36px 32px;
	}

	.logo-row {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-bottom: 28px;
	}

	.logo-box {
		width: 56px;
		height: 56px;
		background: var(--yellow);
		border: var(--border);
		box-shadow: var(--shadow);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
		flex-shrink: 0;
	}

	h1 {
		font-size: 24px;
		font-weight: 700;
		line-height: 1.1;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	.tagline {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #555;
		margin-top: 2px;
	}

	/* Mode tabs */
	.mode-tabs {
		display: flex;
		gap: 0;
		margin-bottom: 24px;
		border: var(--border);
		box-shadow: var(--shadow-sm);
	}

	.mode-tabs button {
		flex: 1;
		border: none;
		box-shadow: none;
		background: var(--white);
		color: #888;
		border-radius: 0;
		padding: 10px;
		font-size: 13px;
	}

	.mode-tabs button:hover:not(:disabled) {
		transform: none;
		box-shadow: none;
		background: var(--bg);
		color: var(--black);
	}

	.mode-tabs button:active:not(:disabled) {
		transform: none;
	}

	.mode-tabs button.active {
		background: var(--yellow);
		color: var(--black);
		border-right: var(--border);
	}

	.mode-tabs button.active:last-child {
		border-right: none;
		border-left: var(--border);
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		font-size: 15px;
		margin-top: 4px;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 10px;
		margin: 20px 0;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #999;
	}

	.divider::before, .divider::after {
		content: '';
		flex: 1;
		height: 2px;
		background: #000;
	}

	.magic-btn {
		width: 100%;
		padding: 12px;
		background: var(--white);
	}

	/* Magic link sent state */
	.magic-sent {
		text-align: center;
		padding: 12px 0;
	}

	.sent-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.sent-title {
		font-size: 20px;
		font-weight: 700;
		text-transform: uppercase;
		margin-bottom: 8px;
	}

	.sent-sub {
		font-size: 14px;
		color: #555;
		margin-bottom: 20px;
		line-height: 1.5;
	}

	.footer-note {
		margin-top: 20px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
		position: relative;
		z-index: 1;
	}
</style>
