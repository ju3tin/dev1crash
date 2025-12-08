import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const adminAddress = "14RxG3uBSHkzpiEE3muBMxg2dEQXw2rSvzJvJatWuQ2r";
    const wallet = req.query.wallet as string | undefined;
    
    // Check if wallet matches admin
    const isAdmin = wallet && wallet === adminAddress;

    // Return the fixed JSON response with isAdmin field
    return res.status(200).json({
      success: true,
      config: {
        admin: adminAddress,
        vault: "9yRoPLZD4f3RkUrHqQvTspeYR2hXukGVCJZFhTwBox83",
      },
      configPda: "g34CWF432qdBWKPczuko7nokJAcCTiT3hcG3zX49yaY",
      isAdmin: isAdmin || false,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
