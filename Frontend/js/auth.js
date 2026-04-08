(function (window) {
  const ACCESS_KEY = "acadly-access-token";
  const REFRESH_KEY = "acadly-refresh-token";
  const USER_KEY = "acadly-user";

  function getAccessToken() {
    try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
  }

  function setSession(payload) {
    if (!payload) return;
    try {
      if (payload.access_token) localStorage.setItem(ACCESS_KEY, payload.access_token);
      if (payload.refresh_token) localStorage.setItem(REFRESH_KEY, payload.refresh_token);
      if (payload.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
        localStorage.setItem("acadly-user-id", String(payload.user.id || ""));
      }
      localStorage.setItem("acadly-authenticated", "true");
    } catch {}
  }

  function clearSession() {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem("acadly-authenticated");
    } catch {}
  }

  async function authFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      clearSession();
    }
    return response;
  }

  function requireAuth(next = "Login.html") {
    const token = getAccessToken();
    if (token) return true;
    const redirectTo = `${next}?next=${encodeURIComponent(window.location.pathname.split("/").pop() || "dashboard_v2.html")}`;
    window.location.href = redirectTo;
    return false;
  }

  window.AcadlyAuth = {
    getAccessToken,
    setSession,
    clearSession,
    authFetch,
    requireAuth,
  };
})(window);
