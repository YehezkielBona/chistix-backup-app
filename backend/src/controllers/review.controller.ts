import { getOrganizerReviewService, replyOrganierReviewService } from "../services/review.service.js";

export async function getOrganizerReviewController(organizerId?: string) {
  try {
    const data = await getOrganizerReviewService(organizerId);
    return {
      success: true,
      statusCode: 200,
      message: "Success load review list",
      data,
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: error.statusCode || 500,
      message: "Fail load review list",
    };
  }
}

export async function replyOrganierReviewController(reviewId: string, body: { replyText?: string }, organizerId: string) {
  try {
    const replyText = String(body?.replyText || "");
    const data = await replyOrganierReviewService(reviewId, replyText, organizerId);

    return {
      success: true,
      statusCode: 200,
      message: "Successfully sent the reply",
      data,
    };
  } catch (error: any) {
    return {
        success: false,
        statusCode: error.statusCode || 400,
        message: error.message || "Failed to send reply"
    }
  }
}
