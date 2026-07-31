import type { UserRole } from "@/types/database";
import type { Profile } from "@/repositories/profilesRepository";

export type Role = UserRole;

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface Session {
  user: AuthUser;
  profile: Profile;
  role: Role;
}
