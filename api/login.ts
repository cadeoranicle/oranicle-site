import { get } from '@vercel/edge-config'

export default async function handler(req, res) {

    const { passkey } = req.body

    const correct = await get('demo_passkey')

    if (passkey === correct) {

        res.setHeader(
            'Set-Cookie',
            'oranicle_demo=ok; Path=/; HttpOnly; Secure'
        )

        res.status(200).end()

    } else {

        res.status(401).end()

    }

}