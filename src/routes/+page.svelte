<script lang="ts">
	import { logger } from '$lib/logger';
	import { signIn, confirmSignIn, setUpTOTP, signOut, type SignInOutput } from 'aws-amplify/auth';

	let username: string = '';
	let password: string = '';
	let signInStep: SignInOutput['nextStep']['signInStep'] | undefined;

	let newPassword: string = '';
	let totpSetupCode: string = '';
	let totpCode: string = '';

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
		signInStep = signInOutput.nextStep.signInStep;
	}

	async function handleNewPassword() {
		logger.info({ newPassword }, 'handleNewPassword');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: newPassword });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleNewPassword');
		signInStep = confirmSignInOutput.nextStep.signInStep;
	}

	async function handleTOTPSetup() {
		logger.info({ totpSetupCode }, 'handleTOTPSetup');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: totpSetupCode });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleTOTPSetup');
		signInStep = confirmSignInOutput.nextStep.signInStep;
	}

	async function handleTOTP() {
		logger.info({ totpCode }, 'handleTOTP');
		const confirmSignInOutput = await confirmSignIn({ challengeResponse: totpCode });
		logger.info(confirmSignInOutput, 'confirmSignInOutput from handleTOTP');
		signInStep = confirmSignInOutput.nextStep.signInStep;
	}
</script>

{#if !signInStep}
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
{:else if signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'}
	<form method="POST" on:submit|preventDefault={handleNewPassword}>
		<label
			>New Password
			<input type="password" name="password" bind:value={newPassword} />
		</label>
		<input type="submit" value="new password" />
	</form>
{:else if signInStep === 'CONTINUE_SIGN_IN_WITH_TOTP_SETUP'}
	<form method="POST" on:submit|preventDefault={handleTOTPSetup}>
		{#await setUpTOTP()}
			<p>Setting up TOTP</p>
		{:then setuptTOTPOutput}
			<p>QR Code</p>
			<QRCode value={setuptTOTPOutput.getSetupUri('test nobkz service')} />
		{:catch error}
			<p>Error setting up TOTP: {error.message}</p>
		{/await}
		<label
			>2FA Code
			<input type="text" name="code" bind:value={totpSetupCode} />
		</label>
		<input type="submit" value="setup totp" />
	</form>
{:else if signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'}
	<form method="POST" on:submit|preventDefault={handleTOTP}>
		<label
			>2FA Code
			<input type="text" name="code" bind:value={totpCode} />
		</label>
		<input type="submit" value="totp" />
	</form>
{:else if signInStep === 'DONE'}
	<p>Done</p>
	<button
		on:click={(e) => {
			signOut().then(() => {
				signInStep = undefined;
			});
		}}>Sign out</button
	>
{:else}
	<p>Unknown step: {signInStep}</p>
{/if}
