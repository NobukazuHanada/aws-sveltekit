<script lang="ts">
	import { logger } from '$lib/logger';

	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {import('./$types').ActionData} */
	export let form;

	let username: string = '';
	let password: string = '';

	$: {
		logger.info({ data, form }, 'sign in page data and from : d');
	}
</script>

{#if form == null}
	<form method="POST">
		<label
			>Username
			<input type="text" bind:value={username} />
		</label>
		<label
			>Password
			<input type="password" bind:value={password} />
		</label>
		<input type="submit" value="signin" />
	</form>
{/if}
