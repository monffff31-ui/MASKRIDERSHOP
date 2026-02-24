(function () {
    const USERS_KEY = 'auth:users';
    const SESSION_KEY = 'auth:session';
    const DEFAULT_ADMIN = { username: 'admin', password: 'monpo112233', isAdmin: true };

    function safeParseJSON(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed ?? fallback;
        } catch {
            return fallback;
        }
    }

    function loadUsers() {
        const raw = localStorage.getItem(USERS_KEY);
        const parsed = safeParseJSON(raw, []);
        return Array.isArray(parsed) ? parsed : [];
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function ensureDefaultAdmin() {
        const users = loadUsers();
        const hasAdmin = users.some((u) => u && u.username === DEFAULT_ADMIN.username);
        if (hasAdmin) return;
        users.unshift(DEFAULT_ADMIN);
        saveUsers(users);
    }

    function getSession() {
        const raw = localStorage.getItem(SESSION_KEY);
        const parsed = safeParseJSON(raw, null);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.username) return null;
        return { username: String(parsed.username) };
    }

    function setSession(username) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
    }

    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }

    function getUser(username) {
        const users = loadUsers();
        return users.find((u) => u && u.username === username) || null;
    }

    function isLoggedIn() {
        return !!getSession();
    }

    function getCurrentUser() {
        const session = getSession();
        if (!session) return null;
        return getUser(session.username);
    }

    function isAdminUser() {
        const user = getCurrentUser();
        return !!(user && user.isAdmin);
    }

    function verifyCurrentUserPassword(password) {
        const user = getCurrentUser();
        if (!user) return false;
        return String(user.password) === String(password);
    }

    function login(username, password) {
        ensureDefaultAdmin();
        const user = getUser(String(username || '').trim());
        
        // Log login attempt
        if (typeof window.excelExport !== 'undefined') {
            window.excelExport.addLoginEntry(username, !!user && String(user.password) === String(password));
        }
        
        if (!user) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้' };
        if (String(user.password) !== String(password)) return { ok: false, message: 'รหัสผ่านไม่ถูกต้อง' };
        setSession(user.username);
        return { ok: true };
    }

    function logout() {
        clearSession();
        localStorage.setItem('admin:isLoggedIn', '0');
    }

    function register(username, password) {
        ensureDefaultAdmin();
        const u = String(username || '').trim();
        const p = String(password || '');

        if (!u) return { ok: false, message: 'กรุณากรอกชื่อผู้ใช้' };
        if (!p || p.length < 4) return { ok: false, message: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร' };

        const users = loadUsers();
        if (users.some((x) => x && x.username === u)) {
            return { ok: false, message: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' };
        }

        users.unshift({ username: u, password: p, isAdmin: false });
        saveUsers(users);
        return { ok: true };
    }

    function getReturnUrl() {
        const params = new URLSearchParams(location.search || '');
        const ru = params.get('returnUrl');
        return ru ? String(ru) : '';
    }

    function requireLogin() {
        ensureDefaultAdmin();
        const path = (location.pathname || '').toLowerCase();
        const isAuthPage = path.endsWith('/login.html') || path.endsWith('login.html') || path.endsWith('/register.html') || path.endsWith('register.html');
        if (isAuthPage) return;

        if (!isLoggedIn()) {
            const returnUrl = location.pathname ? (location.pathname.split('/').pop() || '') : '';
            const qs = location.search || '';
            const target = returnUrl + qs;
            location.href = 'login.html?returnUrl=' + encodeURIComponent(target);
        }
    }

    function updateHeaderUI() {
        const accountLink = document.getElementById('accountLink');
        const logoutLink = document.getElementById('logoutLink');
        const adminLink = document.getElementById('adminLink');

        const user = getCurrentUser();
        if (accountLink) {
            if (user) {
                accountLink.textContent = '👤 ' + user.username;
                accountLink.setAttribute('href', '#');
            } else {
                accountLink.textContent = '👤 บัญชีของฉัน';
                accountLink.setAttribute('href', 'login.html');
            }
        }

        if (logoutLink) {
            logoutLink.style.display = user ? 'inline-block' : 'none';
            if (!logoutLink.dataset.bound) {
                logoutLink.dataset.bound = '1';
                logoutLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    logout();
                    location.href = 'login.html';
                });
            }
        }

        if (adminLink) {
            adminLink.style.display = user && user.isAdmin ? 'inline-block' : 'none';
        }
    }

    ensureDefaultAdmin();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            requireLogin();
            updateHeaderUI();
        });
    } else {
        requireLogin();
        updateHeaderUI();
    }

    window.auth = {
        loadUsers,
        getSession,
        isLoggedIn,
        getCurrentUser,
        isAdminUser,
        verifyCurrentUserPassword,
        login,
        logout,
        register,
        getReturnUrl,
        requireLogin,
        updateHeaderUI,
    };
})();
