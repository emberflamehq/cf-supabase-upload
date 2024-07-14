import { Handle } from "sidra";
import { AppController } from "./controllers/app.controller";
import { BookmarkController } from "./controllers/bookmark.controller";
import { ShortenController } from "./controllers/shorten.controller";
import { StorageController } from "./controllers/storage.controller";

declare global {
	const SUPABASE_URL: string;
	const SUPABASE_KEY: string;
	const USERNAME: string;
	const PASSWORD: string;
	const BASE_URL: string;
	const MAX_FILE_SIZE: string;
	const DISCORD_WEBHOOK_URL: string;
}

const handler = Handle(
	[StorageController, AppController],
	{
		allowedHeaders: "Content-Type, Authorization, X-Storage-Username, X-Storage-Password",
		methods: "GET, POST, OPTIONS, HEAD",
		credentials: true,
		origin: "*",
		maxAge: 86400,
	},
);

/**
 * @param {Response|Promise<Response>} res
 * @returns {Promise<Response>}
 */
async function corsEnabler(res) {
	res = await res;
	const corsResponse = new Response(res.body, res);
	corsResponse.headers.set('Access-Control-Allow-Origin', '*');
	corsResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
	corsResponse.headers.set('Access-Control-Allow-Headers', 'origin, content-type, accept, Content-Type, Authorization, X-Storage-Username, X-Storage-Password');
	corsResponse.headers.set('Access-Control-Allow-Credentials', 'true');
	return corsResponse;
}

addEventListener("fetch", (event: FetchEvent) => {
	if (event.request.method === 'OPTIONS') {
		event.respondWith(new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
				'Access-Control-Allow-Headers': 'origin, content-type, accept, Content-Type, Authorization, X-Storage-Username, X-Storage-Password',
				'Access-Control-Allow-Credentials': 'true'
			}
		}));
	} else {
		event.respondWith(corsEnabler(handler(event.request)));
	}
});
