export class ErrorHandler {
  static handleCustomError(message: string, error: any, details = {}, statusCode: number = 500) {
    if (error.isCustom) {
      return error;
    }
    console.error({ message, details, error });
    return { statusCode, message, details, error, isCustom: true };
  }
}
