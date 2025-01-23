import {Context, TypedResponse} from "hono"
import * as KategoriWBSService from "$services/KategoriWBSService"
import { handleServiceErrorWithResponse, response_created, response_success } from "$utils/response.utils"
import { KategoriWBSDTO } from "$entities/KategoriWBS"
import { FilteringQueryV2 } from "$entities/Query"
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery"

export async function create(c:Context): Promise<TypedResponse> {
    const data: KategoriWBSDTO = await c.req.json();

    const serviceResponse = await KategoriWBSService.create(data);

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_created(c, serviceResponse.data, "Successfully created new KategoriWBS!");
}

export async function getAll(c:Context): Promise<TypedResponse> {
    const filters: FilteringQueryV2 = checkFilteringQueryV2(c)

    const serviceResponse = await KategoriWBSService.getAll(filters)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all KategoriWBS!")
}

export async function getById(c:Context): Promise<TypedResponse> {
    const id = c.req.param('id')

    const serviceResponse = await KategoriWBSService.getById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched KategoriWBS by id!")
}

export async function update(c:Context): Promise<TypedResponse> {
    const data: KategoriWBSDTO = await c.req.json()
    const id = c.req.param('id')

    const serviceResponse = await KategoriWBSService.update(id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated KategoriWBS!")
}

export async function deleteByIds(c:Context): Promise<TypedResponse> {
    const ids = c.req.query('ids') as string

    const serviceResponse = await KategoriWBSService.deleteByIds(ids)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted KategoriWBS!")
}
    