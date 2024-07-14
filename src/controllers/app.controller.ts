import { type IRequest } from "itty-router";
import {
	Controller,
	Get,
	HTTPStatus,
	Middleware,
	NotFoundException,
	Redirect,
	type APIRes,
	type IRedirectRes,
} from "sidra";
import { supabaseClient } from "../libs/supabase";
import { auth } from "../middlewares/auth";

@Controller()
export class AppController {
	@Get()
	get(): APIRes<string> {
		return {
			statusCode: HTTPStatus.FOUND,
			data: "Healthy",
			message: "Healthy"
		};
	}

	@Middleware(auth)
	@Get("/auth-test")
	auth(): APIRes<string> {
		return {
			data: "auth successfull",
			message: "Hello, world!",
			statusCode: HTTPStatus.OK,
		};
	}
}


