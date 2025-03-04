import { Roles, Unit } from "@prisma/client";

export interface UserJWTDAO {
  id: string;
  email: string;
  name: string; // ganti fullName menjadi name
  no_identitas: string; // tambahkan field baru
  role: Roles;
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
  program_studi?: string; // field opsional
  role: Roles;
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
