<script lang="ts">
	import QRCode from 'qrcode';
	import { logger } from './logger';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	export let value: string;

	onMount(async () => {
		const qrCode = await QRCode.toCanvas(canvas, value);
		logger.info(qrCode, 'qrCode');
	});
</script>

<canvas bind:this={canvas}></canvas>
