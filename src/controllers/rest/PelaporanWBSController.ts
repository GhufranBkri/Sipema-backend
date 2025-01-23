import { Context, TypedResponse } from "hono";
import * as PelaporanWBSService from "$services/PelaporanWBSService";
import {
  handleServiceErrorWithResponse,
  response_created,
  response_success,
} from "$utils/response.utils";
import { PelaporanWBSDTO } from "$entities/PelaporanWBS";
import { FilteringQueryV2 } from "$entities/Query";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";
// import { UserJWTDAO } from "$entities/User";

export async function create(c: Context): Promise<TypedResponse> {
  const data: PelaporanWBSDTO = await c.req.json();

  const serviceResponse = await PelaporanWBSService.create(data);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_created(
    c,
    serviceResponse.data,
    "Successfully created new PelaporanWBS!"
  );
}

export async function getAll(c: Context): Promise<TypedResponse> {
  const filters: FilteringQueryV2 = checkFilteringQueryV2(c);
  //   const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await PelaporanWBSService.getAll(filters);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched all PelaporanWBS!"
  );
}

export async function getById(c: Context): Promise<TypedResponse> {
  const id = c.req.param("id");

  const serviceResponse = await PelaporanWBSService.getById(id);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched PelaporanWBS by id!"
  );
}

export async function update(c: Context): Promise<TypedResponse> {
  const data: PelaporanWBSDTO = await c.req.json();
  const id = c.req.param("id");

  const serviceResponse = await PelaporanWBSService.update(id, data);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully updated PelaporanWBS!"
  );
}

export async function deleteByIds(c: Context): Promise<TypedResponse> {
  const ids = c.req.query("ids") as string;

  const serviceResponse = await PelaporanWBSService.deleteByIds(ids);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully deleted PelaporanWBS!"
  );
}
