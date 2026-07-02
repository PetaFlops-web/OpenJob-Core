import ClientError from "./Client-Error.js";

class ForbiddenError extends ClientError {
  constructor(message) {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export default ForbiddenError;
