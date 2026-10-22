import { NextRequest, NextResponse } from "next/server";
import { createEventController, getAllEventController } from "@/controllers/event.controller";


export async function POST(req: NextRequest){
    try {
        const body = await req.json()
        const result = await createEventController(body)

        return NextResponse.json({
            success: result.success,
            message: result.message,
            data: result.data,
            errors: result.errors,
        },
        {status: result.statusCode}
    )
    } catch (error: any) {
        console.error("API POST Event Error:", error)
        return NextResponse.json(
            {success: false, messagee: "Interval server error", errors: error.message},
            {status: 500}
        )
    }
}

export async function GET() {
    try {
        const result = await getAllEventController()
        return NextResponse.json(
            {
                success: result.success,
                data: result.data
            },
            {status: result.statusCode}
        )
    } catch (error:any) {
        console.error("API GET Events Error:", error)
        return NextResponse.json(
            {success: false, message: "Gagal mengambil data event"},
            {status: 500}
        )
    }
}