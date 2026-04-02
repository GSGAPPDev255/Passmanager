<script lang="ts">
	import { goto } from '$app/navigation';
	import { session } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	onMount(() => {
		if ($session) {
			goto('/vault');
		} else {
			goto('/auth/login');
		}
	});
</script>
