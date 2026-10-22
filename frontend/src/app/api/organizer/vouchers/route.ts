import { NextRequest, NextResponse } from "next/server";
import { getVouchersController, createVoucherController } from "@/controllers/voucher.controller";

// GET API (/api/organizer/vouchers)
export async function GET() {
  try {
    const result = await getVouchersController();
    return NextResponse.json({ success: result.success, data: result.data }, { status: result.statusCode });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error", errors: error.message },
      {
        status: 500,
      },
    );
  }
}

// POST API (/api/organizer/vouchers)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createVoucherController(body);
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        data: result.data,
        errors: result.errors,
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
      { status: 500 },
    );
  }
}
