type Profile = {
  id: string;
  full_name: string | null;
  created_at: string;
  email: string | null;
  is_active: boolean | null;
};

type Role = { user_id: string; role: "admin" | "user" };

export type UserWithRole = Profile & { role: "admin" | "user" };

export function validateNewUserForm(email: string, password: string): string | null {
  if (!email.trim()) return "El email es requerido";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  return null;
}

export function mergeUsersWithRoles(profiles: Profile[], roles: Role[]): UserWithRole[] {
  return profiles.map((p) => ({
    ...p,
    role: (roles.find((r) => r.user_id === p.id)?.role ?? "user") as "admin" | "user",
  }));
}

export function canEditUser(currentUserId: string, targetUserId: string): boolean {
  return currentUserId !== targetUserId;
}
