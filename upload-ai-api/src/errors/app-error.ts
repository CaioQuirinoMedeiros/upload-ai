export class AppError extends Error {
  message: string
  statusCode: number

  constructor(params: { message: string; statusCode?: number }) {
    super()
    this.message = params.message
    this.statusCode = params.statusCode ?? 400
  }
}
