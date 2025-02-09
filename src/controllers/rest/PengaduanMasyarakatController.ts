import { Context, TypedResponse } from "hono"
import * as PengaduanMasyarakatService from "$services/PengaduanMasyarakatService"
import { handleServiceErrorWithResponse, response_success } from "$utils/response.utils"
import { FilteringQueryV2 } from "$entities/Query"
import { checkFilteringQueryV2 } from "$controllers/helpers/CheckFilteringQuery"
import { PengaduanMasyarakatDTO } from "$entities/PengaduanMasyarakat"
import { UserJWTDAO } from "$entities/User"


// PengaduanMasyarakatController.ts
export async function create(c: Context): Promise<TypedResponse> {
    const data: PengaduanMasyarakatDTO = await c.req.json();

    // Langsung gunakan entity tanpa konversi
    const serviceResponse = await PengaduanMasyarakatService.create(data);

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse);
    }

    return response_success(c, serviceResponse.data, "Successfully Create PengaduanMasyarakat!")
}



export async function getAll(c: Context): Promise<TypedResponse> {
    const filterByRole: FilteringQueryV2 = c.get("filters")  
    const filter: FilteringQueryV2 = checkFilteringQueryV2(c); 
    const user: UserJWTDAO = c.get("jwtPayload");


    const serviceResponse = await PengaduanMasyarakatService.getAll(filter, filterByRole, user)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched all PengaduanMasyarakat!")
}

export async function getById(c: Context): Promise<TypedResponse> {
    const id = c.req.param('id')

    const serviceResponse = await PengaduanMasyarakatService.getById(id)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully fetched PengaduanMasyarakat by id!")
}

export async function update(c: Context): Promise<TypedResponse> {
    const data: PengaduanMasyarakatDTO = await c.req.json();
    const id = c.req.param('id')



    const serviceResponse = await PengaduanMasyarakatService.update(id, data)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully updated PengaduanMasyarakat!")
}

export async function deleteByIds(c: Context): Promise<TypedResponse> {
    const ids = c.req.query('ids') as string

    const serviceResponse = await PengaduanMasyarakatService.deleteByIds(ids)

    if (!serviceResponse.status) {
        return handleServiceErrorWithResponse(c, serviceResponse)
    }

    return response_success(c, serviceResponse.data, "Successfully deleted PengaduanMasyarakat!")
}
