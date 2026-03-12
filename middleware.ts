import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
    matcher: ['/((?!hero.html|api|favicon.ico).*)'],
}

export default function middleware(req: NextRequest) {

    const cookie = req.cookies.get('oranicle_demo')

    if (cookie?.value === 'ok') {
        return NextResponse.next()
    }

    const url = req.nextUrl.clone()
    url.pathname = '/hero.html'

    return NextResponse.redirect(url)

}