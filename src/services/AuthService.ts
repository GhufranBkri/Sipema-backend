import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import {
  exclude,
  UserRegisterDTO,
  UserLoginDTO,
  UserJWTDAO,
} from "$entities/User";
import {
  BadRequestWithMessage,
  INTERNAL_SERVER_ERROR_SERVICE_RESPONSE,
  ServiceResponse,
} from "$entities/Service";
import { prisma } from "$utils/prisma.utils";
import Logger from "$pkg/logger";
import bcrypt from "bcrypt";

function createToken(user: User) {
  const jwtPayload = exclude(user, "password") as unknown as UserJWTDAO;
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET ?? "", {
    expiresIn: 3600 * 24,
  });
  return token;
}

export async function logIn(data: UserLoginDTO): Promise<ServiceResponse<any>> {
  try {
    const { no_identitas, password } = data;

    const user = await prisma.user.findUnique({
      where: {
        no_identitas: no_identitas,
      },
      include: {
        userLevel: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return {
        status: false,
        err: {
          message: "Invalid credential!",
          code: 404,
        },
        data: {},
      };
    }

    const isPasswordVerified = await bcrypt.compare(password, user.password);

    if (isPasswordVerified) {
      const token = createToken(user);
      return {
        status: true,
        data: {
          user: exclude(user, "password"),
          token,
        },
      };
    } else {
      return {
        status: false,
        err: {
          message: "Invalid credential!",
          code: 404,
        },
        data: {},
      };
    }
  } catch (err) {
    Logger.error(`AuthService.login : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function register(
  data: UserRegisterDTO
): Promise<ServiceResponse<any>> {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const finduserLevel = await prisma.userLevels.findUnique({
      where: {
        name: data.userLevelName,
      },
    });

    if (!finduserLevel) {
      return BadRequestWithMessage("Invalid userLevelName!");
    }

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        no_identitas: data.no_identitas,
        no_telphone: data.no_telphone || null,
        program_studi: data.program_studi || null,
        userLevelId: finduserLevel.id,
      },
      include: {
        userLevel: true,
      },
    });

    const token = createToken(newUser);

    return {
      status: true,
      data: {
        user: exclude(newUser, "password"),
        token,
      },
    };
  } catch (err) {
    Logger.error(`AuthService.register : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export function verifyToken(token: string): ServiceResponse<any> {
  try {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "";
      jwt.verify(token, JWT_SECRET);
      return {
        status: true,
        data: {},
      };
    } catch (err) {
      return {
        status: false,
        err: {
          code: 403,
          message: "Invalid Token",
        },
        data: {},
      };
    }
  } catch (err) {
    Logger.error(`AuthService.verifyToken : ${err}`);
    return INTERNAL_SERVER_ERROR_SERVICE_RESPONSE;
  }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<ServiceResponse<any>> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return BadRequestWithMessage("Invalid User ID!");
    }

    const match = await bcrypt.compare(oldPassword, user.password);

    if (!match) {
      return BadRequestWithMessage("Incorrect Old Password!");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedNewPassword,
      },
    });

    return {
      status: true,
      data: {},
    };
  } catch (err) {
    Logger.error(`AuthService.changePassword : ${err}`);
    return {
      status: false,
      err: { message: (err as Error).message, code: 500 },
      data: {},
    };
  }
}
