// SIH Mining Secure Enclave Authentication Controller

const AuthController = {
  STORAGE_KEY: "sih_mining_auth_session",

  isAuthenticated: function() {
    return !!this.getSession();
  },

  getSession: function() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY) || sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  login: function(employeeId, password, rememberDevice = true) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!employeeId || employeeId.trim().length === 0) {
          reject(new Error("Employee ID is required."));
          return;
        }

        const sessionData = {
          employeeId: employeeId.trim(),
          loginTime: new Date().toISOString(),
          enclaveToken: "SEC-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
          role: "Mining Operational Auditor",
          department: "Ministry of Coal, GoI"
        };

        try {
          if (rememberDevice) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
          } else {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
          }
        } catch (storageErr) {
          console.warn("Storage quota or error:", storageErr);
        }

        resolve(sessionData);
      }, 300);
    });
  },

  logout: function() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
  }
};

if (typeof window !== "undefined") {
  window.AuthController = AuthController;
}
