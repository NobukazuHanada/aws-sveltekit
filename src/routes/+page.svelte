<script lang="ts">
	import { logger } from '$lib/logger';
	import QRCode from '$lib/QRCode.svelte';
	import {
		signIn,
		confirmSignIn,
		setUpTOTP,
		signOut,
		type SignInOutput,
		type ConfirmSignInOutput,
		autoSignIn,
		getCurrentUser
	} from 'aws-amplify/auth';

	let username: string = '';
	let password: string = '';
	let nextStep: SignInOutput['nextStep'] | ConfirmSignInOutput['nextStep'] | undefined;

	let newPassword: string = '';
	let totpSetupCode: string = '';
	let totpCode: string = '';

	(async () => {
		const currentUserOutput = await getCurrentUser();
		logger.info(currentUserOutput, 'currentUserOutput');
	})();

	async function handleLogin() {
		logger.info({ username, password }, 'handleLogin');
		const signInOutput = await signIn({
			username: username,
			password: password,
			options: {
				authFlowType: 'USER_SRP_AUTH'
			}
		});
		logger.info(signInOutput, 'signInOutput from handleLogin');
		nextStep = signInOutput.nextStep;
	}

	async function handleNewPassword() {
		logger.info({ newPassword }, 'handleNewPassword');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: newPassword });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleNewPassword');
		nextStep = confirmSignInOutput.nextStep;
	}

	async function handleTOTPSetup() {
		logger.info({ totpSetupCode }, 'handleTOTPSetup');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: totpSetupCode });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleTOTPSetup');
		nextStep = confirmSignInOutput.nextStep;
	}

	async function handleTOTP() {
		logger.info({ totpCode }, 'handleTOTP');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: totpCode });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleTOTP');
		nextStep = confirmSignInOutput.nextStep;
	}
</script>

{#if !nextStep}
	<form method="POST" on:submit|preventDefault={handleLogin}>
		<label
			>Username
			<input name="username" type="text" bind:value={username} />
		</label>
		<label
			>Password
			<input type="password" name="password" bind:value={password} />
		</label>
		<input type="submit" value="signin" />
	</form>
{:else if nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'}
	<form method="POST" on:submit|preventDefault={handleNewPassword}>
		<label
			>New Password
			<input type="password" name="password" bind:value={newPassword} />
		</label>
		<input type="submit" value="new password" />
	</form>
{:else if nextStep.signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'}
	<form method="POST" on:submit|preventDefault={handleTOTPSetup}>
		<p>QR Code</p>
		<QRCode value={nextStep.totpSetupDetails.getSetupUri('test nobkz service').toString()} />
		<label
			>2FA Code
			<input type="text" name="code" bind:value={totpSetupCode} />
		</label>
		<input type="submit" value="setup totp" />
	</form>
{:else if nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'}
	<form method="POST" on:submit|preventDefault={handleTOTP}>
		<label
			>2FA Code
			<input type="text" name="code" bind:value={totpCode} />
		</label>
		<input type="submit" value="totp" />
	</form>
{:else if nextStep.signInStep === 'DONE'}
	<p>Done</p>
	<button
		on:click={(e) => {
			signOut().then(() => {
				nextStep = undefined;
			});
		}}>Sign out</button
	>
{:else}
	<p>Unknown step: {nextStep.signInStep}</p>
{/if}
