import { 
    getOrganizerTransactionService,
    acceptTransactionService,
    rejectTransactionService
 } from "../services/transaction.service.js";

export async function getOrganizerTransactionsController(organizerId?: string) {
  try {
    const defaultOrganizerId = organizerId || "organizer-1"; // Fallback jika belum login saat tes
    const data = await getOrganizerTransactionService(defaultOrganizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Success load transaction list",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: error.message || "Failed load transactions!",
    };
  }
}

 export async function acceptTransactionController(transactionId: string, organizerId?: string) {
  try {
    const defaultOrganizerId = organizerId || "organizer-1";
    const data = await acceptTransactionService(transactionId, defaultOrganizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Transaction Approved!",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 400,
      message: error.message || "Failed load transactions!",
    };
  }
}

export async function rejectTransactionController(transactionId: string, organizerId?: string) {
    try {
        const defaultOrganizerId = organizerId || "organizer-1"
        const data = await rejectTransactionService(transactionId, defaultOrganizerId)
        return {
            success: true,
            statusCode: 200,
            message: "Transaction Rejected! returned quota ticket",
            data,
        }
    } catch (error: any) {
        return {
            success: false,
            statusCode: error.statusCode || 400,
            message: error.message || "Failed load transactions!"
        }
    }
}