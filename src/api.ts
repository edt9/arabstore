/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Game, ConfigStatus } from "./types";

const API_BASE = "/api";

// Auth helper
export function getAdminToken(): string | null {
  return localStorage.getItem("playstore_admin_token");
}

export function setAdminToken(token: string) {
  localStorage.setItem("playstore_admin_token", token);
}

export function removeAdminToken() {
  localStorage.removeItem("playstore_admin_token");
}

function getHeaders() {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getAdminToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchGames(): Promise<Game[]> {
  const response = await fetch(`${API_BASE}/games`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch games");
  }
  return response.json();
}

export async function fetchConfigStatus(): Promise<ConfigStatus> {
  const response = await fetch(`${API_BASE}/config-status`);
  if (!response.ok) {
    throw new Error("Failed to fetch configuration status");
  }
  return response.json();
}

export async function loginAdmin(email: string, password: string): Promise<{ token: string; email: string }> {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ في تسجيل الدخول");
  }
  const data = await response.json();
  setAdminToken(data.token);
  return data;
}

export async function verifyAdmin(): Promise<{ isAuthenticated: boolean; email?: string }> {
  const token = getAdminToken();
  if (!token) return { isAuthenticated: false };

  const response = await fetch(`${API_BASE}/admin/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) return { isAuthenticated: false };
  return response.json();
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch(`${API_BASE}/admin/logout`, {
      method: "POST",
      headers: getHeaders(),
    });
  } catch (e) {
    console.error("Logout request failed, cleaning local storage anyway", e);
  }
  removeAdminToken();
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      // Note: Do not set Content-Type, fetch sets multipart/form-data boundary automatically
      ...(getAdminToken() ? { "Authorization": `Bearer ${getAdminToken()}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ أثناء رفع الصورة");
  }
  const data = await response.json();
  return data.url;
}

export async function createGame(gameData: Omit<Game, "id" | "created_at" | "updated_at">): Promise<Game> {
  const response = await fetch(`${API_BASE}/games`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ أثناء إضافة اللعبة");
  }
  return response.json();
}

export async function updateGame(id: string, gameData: Omit<Game, "id" | "created_at" | "updated_at">): Promise<Game> {
  const response = await fetch(`${API_BASE}/games/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ أثناء تعديل اللعبة");
  }
  return response.json();
}

export async function deleteGame(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/games/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ أثناء حذف اللعبة");
  }
}

export async function saveReorderedGames(orderedGames: Game[]): Promise<void> {
  const response = await fetch(`${API_BASE}/games/reorder`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ orderedGames }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "خطأ أثناء حفظ الترتيب الجديد");
  }
}
