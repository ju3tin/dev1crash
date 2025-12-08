import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // Return the fixed JSON response
    return res.status(200).json({
      success: true,
      config: {
            admin: "AgDCRcYy1p3SG3NpBgL6HKN2xdQrQgSsyW5zcNsj7rbF",
        vault: "9yRoPLZD4f3RkUrHqQvTspeYR2hXukGVCJZFhTwBox83",
      },
      configPda: "g34CWF432qdBWKPczuko7nokJAcCTiT3hcG3zX49yaY",
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
