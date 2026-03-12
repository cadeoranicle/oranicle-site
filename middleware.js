const HERO_PATH = '/hero.html';
const LOGIN_PATH = '/__demo_login';
const LOGOUT_PATH = '/__demo_logout';
const COOKIE_NAME = 'oranicle_demo';
const DEFAULT_NEXT = '/index.html';

function hex(buffer) {
    return [...new Uint8Array(buffer)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function sha256(input) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return hex(digest);
}

async function buildCookieToken(passkey, secret) {
    return sha256(`${secret}::${passkey}`);
}

function redirect(to, status = 302) {
    return Response.redirect(typeof to === 'string' ? to : to.toString(), status);
}

function setCookieHeader(name, value, maxAgeSeconds) {
    return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
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

    const secret = process.env.DEMO_COOKIE_SECRET;
    if (!secret) {
        return new Response('DEMO_COOKIE_SECRET is not configured.', { status: 500 });
    }

    let passkey;
    try {
        passkey = await getDemoPasskey();
    } catch (err) {
        return new Response(`Failed to read demo passkey: ${String(err)}`, { status: 500 });
    }

    if (!passkey) {
        return new Response('Edge Config key "demo_passkey" is not configured.', { status: 500 });
    }

    const expectedToken = await buildCookieToken(passkey, secret);

    const cookieHeader = request.headers.get('cookie') || '';
    const currentToken =
        cookieHeader
            .split(';')
            .map((x) => x.trim())
            .find((x) => x.startsWith(`${COOKIE_NAME}=`))
            ?.split('=')
            ?.slice(1)
            ?.join('=') || '';

    const isAuthenticated = currentToken === expectedToken;

    if (pathname === LOGOUT_PATH) {
        const res = redirect(new URL(HERO_PATH, request.url), 302);
        res.headers.append('Set-Cookie', clearCookieHeader(COOKIE_NAME));
        return res;
    }

    if (pathname === LOGIN_PATH && request.method === 'POST') {
        const body = await request.text();
        const form = new URLSearchParams(body);

        const submittedPasskey = (form.get('passkey') || '').trim();
        const next = (form.get('next') || DEFAULT_NEXT).trim();

        if (submittedPasskey === passkey) {
            const res = redirect(new URL(next, request.url), 302);
            res.headers.append(
                'Set-Cookie',
                setCookieHeader(COOKIE_NAME, expectedToken, 60 * 60 * 8)
            );
            return res;
        }

        const failUrl = new URL(HERO_PATH, request.url);
        failUrl.searchParams.set('error', '1');
        failUrl.searchParams.set('next', next || DEFAULT_NEXT);
        return redirect(failUrl, 302);
    }

    if (isPublicPath(pathname)) {
        if (pathname === HERO_PATH && isAuthenticated) {
            return redirect(new URL(DEFAULT_NEXT, request.url), 302);
        }
        return;
    }

    if (!isAuthenticated) {
        const loginUrl = new URL(HERO_PATH, request.url);
        loginUrl.searchParams.set('next', pathname + url.search);
        return redirect(loginUrl, 302);
    }

    return;
}

export const config = {
    matcher: ['/((?!_next).*)'],
};