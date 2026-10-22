import { NextRequest, NextResponse } from "next/server";
import { updateVoucherController, softDeleteVoucherController } from "@/controllers/voucher.controller";
import { prisma } from "@/lib/prisma";

// GET API
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: { event: true },
    });
    if (!voucher || voucher.deletedAt) {
      return NextResponse.json(
        { success: false, message: "Voucher tidak ditemukan" }, 
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, data: voucher }, 
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message }, 
      { status: 500 }
    );
  }
}


// UPDATE API (/api/organizer/vouchers/[id])
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const result = await updateVoucherController(id, body);
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
      { status: 500 },
    );
  }
}

// SOFT DELETE (/api/organizer/vouchers[id])
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await softDeleteVoucherController(id);
    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
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
