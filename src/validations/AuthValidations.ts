import { UserLoginDTO, UserRegisterDTO } from '$entities/User';
import { Context, Next } from "hono"
import { response_bad_request, response_not_found } from '../utils/response.utils';
import { prisma } from '../utils/prisma.utils';

function validateEmailFormat(email: string): boolean {
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return expression.test(email)
}

export async function validateRegisterDTO(c: Context, next: Next) {

    const data: UserRegisterDTO = await c.req.json()

    const invalidFields = [];
    if (!data.email) invalidFields.push("email is required")
    if (!data.name) invalidFields.push("fullname is required")
    if (!validateEmailFormat(data.email)) invalidFields.push("email format is invalid")
    if (!data.password) invalidFields.push("password is required")

    const userExist = await prisma.user.findUnique({
        where: {
            no_identitas: data.no_identitas
        }
    })

    if (userExist != null) {
        invalidFields.push("no identity already used")
    }
    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields);
    }

    await next();
}

export async function validateLoginDTO(c: Context, next: Next) {
    const data: UserLoginDTO = await c.req.json()

    const invalidFields = [];
    if (!data.no_identitas) {
        invalidFields.push("NPM or NIP is required")
    }
    if (!data.password) {
        invalidFields.push("password is required")
    }

    if (invalidFields.length > 0) {
        return response_bad_request(c, "Bad Request", invalidFields);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
        where: {
            no_identitas: data.no_identitas
        }
    });

    if (!user) {
        return response_not_found(c, "User not found");
    }

    // Store user in context for next middleware
    c.set('loginUser', user);

    await next();
}