import { Context, TypedResponse } from "hono";
import * as NotificationService from "$services/NotificationService";
import {
  handleServiceErrorWithResponse,
  response_created,
  //   response_created,
  response_success,
} from "$utils/response.utils";
import {
  NotificationDTO,
  NotificationOfficerAllert,
} from "$entities/Notification";
import { FilteringQueryV2 } from "$entities/Query";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";
import { UserJWTDAO } from "$entities/User";

// export async function create(c: Context): Promise<TypedResponse> {
//   const data: NotificationDTO = await c.req.json();

//   const serviceResponse = await NotificationService.create(data);

//   if (!serviceResponse.status) {
//     return handleServiceErrorWithResponse(c, serviceResponse);
//   }

//   return response_created(
//     c,
//     serviceResponse.data,
//     "Successfully created new Notification!"
//   );
// }

export async function notifyOfficerAlert(c: Context): Promise<TypedResponse> {
  const data: NotificationOfficerAllert = await c.req.json();

  const serviceResponse = await NotificationService.sendAllertToOfficerAllert(
    data
  );

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_created(
    c,
    serviceResponse.data,
    "Successfully created new Notification!"
  );
}

export async function getAll(c: Context): Promise<TypedResponse> {
  const filters: FilteringQueryV2 = checkFilteringQueryV2(c);
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await NotificationService.getAll(filters, user);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched all Notification!"
  );
}

export async function getById(c: Context): Promise<TypedResponse> {
  const id = c.req.param("id");

  const serviceResponse = await NotificationService.getById(id);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched Notification by id!"
  );
}

export async function update(c: Context): Promise<TypedResponse> {
  const data: NotificationDTO = await c.req.json();
  const id = c.req.param("id");

  const serviceResponse = await NotificationService.update(id, data);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully updated Notification!"
  );
}

export async function deleteByIds(c: Context): Promise<TypedResponse> {
  const ids = c.req.query("ids") as string;

  const serviceResponse = await NotificationService.deleteByIds(ids);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully deleted Notification!"
  );
}
