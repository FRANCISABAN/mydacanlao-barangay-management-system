export class ApiError extends Error {
  // fields: { fieldName: 'message' } for highlighted form fields.
  // extra: more data sent to the client, e.g. { conflict } or { duplicate }.
  constructor(message, status = 400, fields, extra) {
    super(message)
    this.status = status
    this.fields = fields
    this.extra = extra
  }
}
