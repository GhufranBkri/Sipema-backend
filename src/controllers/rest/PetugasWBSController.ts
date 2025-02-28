import { Context, TypedResponse } from "hono";
import * as PetugasWBSService from "$services/PetugasWBSService";
import {
  handleServiceErrorWithResponse,
  response_created,
  response_success,
} from "$utils/response.utils";
import { PetugasWBSDTO } from "$entities/PetugasWBS";
import { FilteringQueryV2 } from "$entities/Query";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";
import { UserJWTDAO } from "$entities/User";

export async function create(c: Context): Promise<TypedResponse> {
  const data: PetugasWBSDTO = await c.req.json();
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await PetugasWBSService.create(data, user);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_created(
    c,
    serviceResponse.data,
    "Successfully created new PetugasWBS!"
  );
}

export async function getAll(c: Context): Promise<TypedResponse> {
  const filters: FilteringQueryV2 = checkFilteringQueryV2(c);

  const serviceResponse = await PetugasWBSService.getAll(filters);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched all PetugasWBS!"
  );
}

export async function getById(c: Context): Promise<TypedResponse> {
  const id = c.req.param("id");

  const serviceResponse = await PetugasWBSService.getById(id);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched PetugasWBS by id!"
  );
}

export async function update(c: Context): Promise<TypedResponse> {
  const data: PetugasWBSDTO = await c.req.json();
  const id = c.req.param("id");

  const serviceResponse = await PetugasWBSService.update(id, data);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully updated PetugasWBS!"
  );
}

export async function deleteByIds(c: Context): Promise<TypedResponse> {
  const ids = c.req.query("ids") as string;

  const serviceResponse = await PetugasWBSService.deleteByIds(ids);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully deleted PetugasWBS!"
  );
}
