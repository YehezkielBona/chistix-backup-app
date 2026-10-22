import { NextRequest, NextResponse } from "next/server";
import { getEventDetailController, updateEventController } from "@/controllers/event.controller";
import { softDeleteEventController } from "@/controllers/event.controller";

export async function GET(
    req: NextRequest,
    {params}: {params: Promise<{id:string}>}
) {
    try {
        const {id} = await params
        const result = await getEventDetailController(id)

        return NextResponse.json(
            {
                success: result.success,
                message: result.message,
                data: result.data
            },
            {status: result.statusCode}
        )
    } catch (error: any) {
        return NextResponse.json(
            {sucess: false, message: "Internal Server Error", errors: error.message},
            {status: 500}
        )
    }
}

export async function PUT(
    req: NextRequest,
    {params}: {params: Promise<{id: string}>}
) {
    try {
        const {id} = await params
        const body = await req.json()
        const result = await updateEventController(id, body)

        return NextResponse.json(
            {success: result.success, message: result.message, data: result.data, errors: result.errors},
            {status: result.statusCode}
        )
    } catch (error: any){
        console.error("API Put Event Error: ", error)
        return NextResponse.json(
            {success: false, message: "Internal Server Error", errors: error.message},
            {status: 500}
        )
    }
}

export async function DELETE(
    req: NextRequest,
    {params} : {params: Promise<{id: string}>}
) {
    try {
        const {id} = await params
        const result = await softDeleteEventController(id)

        return NextResponse.json(
            {sucess: result.success, message: result.message},
            {status: result.statusCode}
        )
    } catch (error: any) {
        return NextResponse.json(
            {sucess: false, message: "Gagal menghapus Event", errors: error.message},
            {status: 500}
        )
    }
}