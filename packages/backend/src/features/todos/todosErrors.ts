import { HttpStatusCodes } from "@the_application_name/common";
import { HttpError } from "@/lib/HttpErrorMetadata";

@HttpError({ status: HttpStatusCodes.NOT_FOUND })
export class TodoNotFoundError extends Error {}