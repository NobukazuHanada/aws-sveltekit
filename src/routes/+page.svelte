<script lang="ts">
	import { logger } from '$lib/logger';
	import type { ActionFailure } from '@sveltejs/kit';
	import type { defaultActionReturnType } from './+page.server';
	import { signIn } from 'aws-amplify/auth';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {import('./$types').ActionData} */
	export let form: defaultActionReturnType | ActionFailure;

	let username: string = '';
	let password: string = '';

	$: {
		logger.info({ data, form }, 'sign in page data and from');
	}
</script>

{#if form == null}
	<form method="POST" action="?/login">
		<label
			>Username
			<input name="username" type="text" bind:value={username} />
		</label>
		<label
			>Password
			<input type="password" name="password" bind:value={password} />
		</label>
		<input
			type="submit"
			value="signin"
			on:click={() => {
				signIn({ username, password, options: { authFlowType: 'USER_SRP_AUTH' } })
					.then((result) => {
						logger.info({ result }, 'sign in result');
						invalidateAll();
					})
					.catch((error) => {
						logger.error({ error }, 'sign in error');
					});
			}}
		/>
	</form>
{:else if 'signInStep' in form}
	{#if form.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'}
		<form method="POST" action="?/new-password">
			<label
				>New Password
				<input name="newPassword" type="password" />
			</label>
			<label
				>Confirm Password
				<input name="comfirmPassword" type="password" />
			</label>
			<input type="hidden" name="token" value={form.token} />
			<input type="submit" value="submit" />
		</form>
	{/if}
{/if}
