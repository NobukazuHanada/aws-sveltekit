/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }): Promise<Response> {
	return resolve(event);
}
