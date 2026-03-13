const HERO_PATH = '/hero.html';
const LOGIN_PATH = '/__demo_login';
const LOGOUT_PATH = '/__demo_logout';
const COOKIE_NAME = 'oranicle_demo_v2';
const DEFAULT_NEXT = '/index.html';

function getCookieValue(cookieHeader, name) {
    const cookies = cookieHeader.split(';').map(c => c.trim());

    for (const cookie of cookies) {
        const parts = cookie.split('=');
        const key = parts.shift();
        const value = parts.join('=');

        if (key === name) {
            return value;
        }
    }

    return null;
}

function redirectResponse(to, cookieHeader = null, status = 302) {
    const headers = new Headers();
    headers.set('Location', typeof to === 'string' ? to : to.toString());
    if (cookieHeader) {
        headers.append('Set-Cookie', cookieHeader);
    }
    return new Response(null, { status, headers });
}

function setCookieHeader(name, value) {
    return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=180`;
}

function clearCookieHeader(name) {
    return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function isPublicPath(pathname) {
    return (
        pathname === HERO_PATH ||
        pathname === LOGIN_PATH ||
        pathname === LOGOUT_PATH ||
        pathname === '/favicon.ico'
    );
}

async function getDemoPasskey() {
    const passkey = process.env.DEMO_PASSKEY;
    if (!passkey) {
        throw new Error('DEMO_PASSKEY is not configured.');
    }
    return passkey;
}

export default async function middleware(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;


    let passkey;
    try {
        passkey = await getDemoPasskey();
    } catch (err) {
        return new Response(`Failed to read demo passkey: ${String(err)}`, { status: 500 });
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const cookieValue = getCookieValue(cookieHeader, COOKIE_NAME);
    const isAuthenticated = cookieValue === 'ok';


    if (pathname === LOGOUT_PATH) {
        return redirectResponse(
            new URL(HERO_PATH, request.url),
            clearCookieHeader(COOKIE_NAME)
        );
    }

    if (pathname === LOGIN_PATH && request.method === 'POST') {
        const body = await request.text();
        const form = new URLSearchParams(body);

        const submittedPasskey = (form.get('passkey') || '').trim();
        let next = (form.get('next') || DEFAULT_NEXT).trim();
        if (next === "/") {
            next = DEFAULT_NEXT;
        }

        if (submittedPasskey === passkey) {
            return redirectResponse(
                new URL(next, request.url),
                setCookieHeader(COOKIE_NAME, 'ok')
            );
        }

        const failUrl = new URL(HERO_PATH, request.url);
        failUrl.searchParams.set('error', '1');
        failUrl.searchParams.set('next', next || DEFAULT_NEXT);
        return redirectResponse(failUrl);
    }

    if (isPublicPath(pathname)) {
        return;
    }

    if (!isAuthenticated) {
        const loginUrl = new URL(HERO_PATH, request.url);
        loginUrl.searchParams.set('next', pathname === "/" ? "/index.html" : pathname + url.search);
        return redirectResponse(loginUrl);
    }

    return;
}

export const config = {
    matcher: ['/((?!_next).*)'],
};