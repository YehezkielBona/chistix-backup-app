import { NextRequest, NextResponse } from "next/server";
import { validateVoucherController } from "@/controllers/voucher.controller";

// POST API (/api/vouchers/validate) atau validasi kode voucher saatn checkout
export async function POST(req: NextRequest) {
  try {
    const { code, eventId } = await req.json();
    if (!code || !eventId) {
      return NextResponse.json(
        {
          success: false,
          message: "Code dan EventId wajib diisi",
        },
        { status: 400 },
      );
    }
    const result = await validateVoucherController(code, eventId);
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
      },
      { status: result.statusCode },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        errors: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
