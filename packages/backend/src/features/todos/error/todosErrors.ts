import { HttpStatusCodes, Uuid } from "@the_application_name/common";
import { HttpError } from "@/lib/HttpErrorMetadata";

@HttpError({ status: HttpStatusCodes.NOT_FOUND })
export class TodoNotFoundError extends Error {
  constructor(
    private readonly params: {
      id: Uuid;
    },
  ) {
    super(`Todo with id '${params.id}' not found`);
  }
}