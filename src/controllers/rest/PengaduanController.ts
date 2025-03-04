import { Context, TypedResponse } from "hono";
import * as PengaduanService from "$services/PengaduanService";
import {
  handleServiceErrorWithResponse,
  response_created,
  response_success,
} from "$utils/response.utils";
import { PengaduanDTO } from "$entities/Pengaduan";
import { FilteringQueryV2 } from "$entities/Query";
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery";
import { UserJWTDAO } from "$entities/User";

export async function create(c: Context): Promise<TypedResponse> {
  const data: PengaduanDTO = await c.req.json();
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await PengaduanService.create(data, user);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_created(
    c,
    serviceResponse.data,
    "Successfully created new Pengaduan!"
  );
}

export async function getAll(c: Context): Promise<TypedResponse> {
  const filter: FilteringQueryV2 = checkFilteringQueryV2(c);
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await PengaduanService.getAll(filter, user);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched all Pengaduan!"
  );
}

export async function getTotalCount(c: Context): Promise<TypedResponse> {
  const serviceResponse = await PengaduanService.getTotalCount();

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched total count of Pengaduan!"
  );
}

export async function getById(c: Context): Promise<TypedResponse> {
  const id = c.req.param("id");

  const serviceResponse = await PengaduanService.getById(id);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully fetched Pengaduan by id!"
  );
}

export async function update(c: Context): Promise<TypedResponse> {
  const data: PengaduanDTO = await c.req.json();
  const id = c.req.param("id");
  const user: UserJWTDAO = c.get("jwtPayload");

  const serviceResponse = await PengaduanService.update(id, data, user);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully updated Pengaduan!"
  );
}

export async function deleteByIds(c: Context): Promise<TypedResponse> {
  const ids = c.req.query("ids") as string;

  const serviceResponse = await PengaduanService.deleteByIds(ids);

  if (!serviceResponse.status) {
    return handleServiceErrorWithResponse(c, serviceResponse);
  }

  return response_success(
    c,
    serviceResponse.data,
    "Successfully deleted Pengaduan!"
  );
}
