import { Unit, UserLevels } from "@prisma/client";

export interface UserJWTDAO {
  id: string;
  email: string;
  name: string;
  no_identitas: string;
  userLevelId: string;
  no_telphone: string;
  userLevel: {
    id: string;
    name: UserLevels;
  };
  program_studi?: string;
  unitId?: string;
}

export interface UserLoginDTO {
  no_identitas: string;
  password: string;
}

export interface UserRegisterDTO {
  email: string;
  password: string;
  name: string; // sesuaikan dengan schema
  no_identitas: string; // tambahkan field wajib
  no_telphone?: string; // tambahkan field wajib
  program_studi?: string; // field opsional
  userLevelName: string;
}

export interface UserDTO {
  no_identitas: string;
  name: string;
  email: string;
  unit: Unit;
}

// Exclude keys from user
export function exclude<User, Key extends keyof User>(
  user: User,
  ...keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}
