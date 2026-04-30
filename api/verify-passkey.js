export default function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { passkey } = req.body || {};
    const expected = process.env.DEMO_PASSKEY;

    if (!expected) {
        return res.status(500).json({ ok: false, error: "Passkey not configured" });
    }

    if (String(passkey || "") === String(expected)) {
        return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ ok: false, error: "Invalid passkey" });
}