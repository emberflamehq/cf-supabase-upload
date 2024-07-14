import {
	BadRequestException,
	Controller,
	Delete,
	Get,
	HTTPStatus,
	InternalServerErrorException,
	Middleware,
	NotFoundException,
	PayloadTooLargeException,
	Post,
	type APIRes,
} from "sidra";
import { supabaseClient } from "../libs/supabase";
import { auth } from "../middlewares/auth";
import { contentType } from "../middlewares/contentType";

function sanitizeFilename(filename: string, maxLength: number = 255) {
    // Replace spaces with underscores
    let sanitized = filename.replace(/\s+/g, '_');

    // Remove any invalid characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9-_\.]/g, '');

    // Ensure the filename length is within the limit
    if (sanitized.length > maxLength) {
        return sanitized.substring(0, maxLength);
    }

    return sanitized;
}

@Controller("/storage")
export class StorageController {
	@Get()
	get(): APIRes<string> {
		return {
			data: "storage",
			message: "Hello, world!",
			statusCode: HTTPStatus.OK,
		};
	}

	@Get("uploads/*")
	async getUploads(req: Request): Promise<Blob> {
		const { pathname } = new URL(req.url);
		const path = pathname.slice("/storage/uploads/".length);

		const { error, data } = await supabaseClient.storage
			.from("uploads")
			.download(path);

		if (error) throw new NotFoundException(`${path} not found`);

		return data;
	}

	@Middleware(auth, contentType("application/json"))
	@Delete("/delete")
	async deleteFile(req: Request): Promise<APIRes<unknown>> {
		const json = await req.json<{
			uuid: string;
		}>();

		const bucket = "upload";
		const { data:list, error } = await supabaseClient.storage.from(bucket).list(`${json.uuid}/`);
		const filesToRemove = list?.map((x) => `${json.uuid}/${x.name}`) || [];

		const { data, error:error2 } = await supabaseClient.storage.from(bucket).remove(filesToRemove);
		if (error) throw new NotFoundException(`${json.uuid} not found`);
		return {
			data,
			message: "file deleted",
			statusCode: HTTPStatus.NO_CONTENT,
		};
	}

	@Middleware(auth, contentType("multipart/form-data"))
	@Post("/upload")
	async postUpload(req: Request): Promise<APIRes<unknown>> {
		const formData = await req.formData();
		const fileUUID = crypto.randomUUID();
		
		if (!formData.has("file")) throw new BadRequestException("no file");

		const file = formData.get("file") as unknown as File;

		if (!file || typeof file == "string" || !(file instanceof File))
			throw new BadRequestException("no file");

		if (file.size > parseInt(MAX_FILE_SIZE))
			throw new PayloadTooLargeException("file too large");

		const path = `${fileUUID}/${sanitizeFilename(file.name)}`;

		const { error } = await supabaseClient.storage
			.from("upload")
			.upload(path, file, {
				contentType: file.type,
			});
		console.log('error', error)
		if (error)
			throw new InternalServerErrorException("internal server error");

		await fetch(DISCORD_WEBHOOK_URL, {
			body: JSON.stringify({
				content: `${BASE_URL}/storage/uploads/${path} uploaded`,
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		console.log('path', path)
		return {
			data: {
				url: `${BASE_URL}/upload/${path}`,
				filename: file.name,
			},
			message: "file uploaded",
			statusCode: HTTPStatus.CREATED,
		};
	}
}
