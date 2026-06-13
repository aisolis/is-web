import { describe, it, expect } from "vitest";
import { validateNewUserForm, mergeUsersWithRoles, canEditUser } from "./users-utils";

// ─── validateNewUserForm ──────────────────────────────────────────────────────

describe("validateNewUserForm", () => {
  it("retorna null cuando email y contraseña son válidos", () => {
    expect(validateNewUserForm("user@test.com", "segura123")).toBeNull();
  });

  it("rechaza email vacío", () => {
    expect(validateNewUserForm("", "segura123")).not.toBeNull();
  });

  it("rechaza email de solo espacios", () => {
    expect(validateNewUserForm("   ", "segura123")).not.toBeNull();
  });

  it("rechaza contraseña con menos de 6 caracteres", () => {
    expect(validateNewUserForm("user@test.com", "12345")).not.toBeNull();
  });

  it("acepta contraseña de exactamente 6 caracteres", () => {
    expect(validateNewUserForm("user@test.com", "123456")).toBeNull();
  });

  it("el error de email vacío menciona 'email'", () => {
    const error = validateNewUserForm("", "123456");
    expect(error?.toLowerCase()).toContain("email");
  });

  it("el error de contraseña corta menciona '6'", () => {
    const error = validateNewUserForm("user@test.com", "123");
    expect(error).toContain("6");
  });
});

// ─── mergeUsersWithRoles ──────────────────────────────────────────────────────

describe("mergeUsersWithRoles", () => {
  const baseProfile = { id: "abc", full_name: "Juan", created_at: "2024-01-01", email: "juan@test.com", is_active: true };

  it("asigna rol 'admin' cuando el perfil tiene rol admin", () => {
    const roles = [{ user_id: "abc", role: "admin" as const }];
    const [user] = mergeUsersWithRoles([baseProfile], roles);
    expect(user.role).toBe("admin");
  });

  it("asigna rol 'user' cuando no hay entrada en roles", () => {
    const [user] = mergeUsersWithRoles([baseProfile], []);
    expect(user.role).toBe("user");
  });

  it("asigna rol 'user' cuando otro usuario tiene admin pero no este", () => {
    const roles = [{ user_id: "otro-id", role: "admin" as const }];
    const [user] = mergeUsersWithRoles([baseProfile], roles);
    expect(user.role).toBe("user");
  });

  it("preserva los datos del perfil", () => {
    const [user] = mergeUsersWithRoles([baseProfile], []);
    expect(user.id).toBe("abc");
    expect(user.full_name).toBe("Juan");
    expect(user.email).toBe("juan@test.com");
  });

  it("maneja múltiples usuarios correctamente", () => {
    const profiles = [
      { ...baseProfile, id: "u1" },
      { ...baseProfile, id: "u2" },
    ];
    const roles = [{ user_id: "u2", role: "admin" as const }];
    const merged = mergeUsersWithRoles(profiles, roles);
    expect(merged[0].role).toBe("user");
    expect(merged[1].role).toBe("admin");
  });

  it("lista vacía de perfiles devuelve lista vacía", () => {
    expect(mergeUsersWithRoles([], [])).toEqual([]);
  });
});

// ─── canEditUser ──────────────────────────────────────────────────────────────

describe("canEditUser", () => {
  it("permite editar otro usuario", () => {
    expect(canEditUser("admin-id", "otro-id")).toBe(true);
  });

  it("impide editar al propio usuario", () => {
    expect(canEditUser("admin-id", "admin-id")).toBe(false);
  });
});
