/**
 * User-friendly error message formatter
 * Converts technical errors into clear, actionable messages
 */

export function formatErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again."

  const errorMessage = typeof error === "string" ? error : error.message || error.error || ""

  // Database/UUID errors
  if (errorMessage.includes("invalid input syntax for type uuid")) {
    return "This item cannot be deleted because it's a default entry. Only custom entries can be removed."
  }

  // Authentication errors
  if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("invalid_grant")) {
    return "The email or password you entered is incorrect. Please try again."
  }
  if (errorMessage.includes("User already registered") || errorMessage.includes("already exists")) {
    return "An account with this email already exists. Try logging in instead."
  }
  if (errorMessage.includes("Email not confirmed")) {
    return "Please verify your email address before logging in. Check your inbox for the confirmation link."
  }
  if (errorMessage.includes("not authorized") || errorMessage.includes("unauthorized")) {
    return "You don't have permission to perform this action."
  }

  // Network errors
  if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
    return "Unable to connect to the server. Please check your internet connection and try again."
  }
  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return "The request took too long. Please try again."
  }

  // Validation errors
  if (errorMessage.includes("required") || errorMessage.includes("cannot be empty")) {
    return "Please fill in all required fields."
  }
  if (errorMessage.includes("invalid email") || errorMessage.includes("email format")) {
    return "Please enter a valid email address."
  }
  if (errorMessage.includes("password") && errorMessage.includes("length")) {
    return "Your password must be at least 6 characters long."
  }

  // Payment errors
  if (errorMessage.includes("insufficient") || errorMessage.includes("not enough tokens")) {
    return "You don't have enough tokens. Please add more tokens to continue."
  }
  if (errorMessage.includes("payment") || errorMessage.includes("stripe")) {
    return "There was a problem processing your payment. Please try again or use a different payment method."
  }

  // File upload errors
  if (errorMessage.includes("file size") || errorMessage.includes("too large")) {
    return "The file is too large. Please choose a smaller file."
  }
  if (errorMessage.includes("file type") || errorMessage.includes("not supported")) {
    return "This file type is not supported. Please use a different file format."
  }

  // Database errors
  if (errorMessage.includes("duplicate key") || errorMessage.includes("unique constraint")) {
    return "This entry already exists. Please use a different value."
  }
  if (errorMessage.includes("foreign key") || errorMessage.includes("violates")) {
    return "This item is connected to other data and cannot be deleted. Please remove related items first."
  }

  // Rate limiting
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return "You're making too many requests. Please wait a moment and try again."
  }

  // Generic fallbacks for common patterns
  if (errorMessage.includes("not found") || errorMessage.includes("404")) {
    return "The requested item could not be found. It may have been deleted."
  }
  if (errorMessage.includes("server error") || errorMessage.includes("500")) {
    return "Something went wrong on our end. Please try again in a few moments."
  }

  // If we have a short, readable error message, use it
  if (errorMessage.length > 0 && errorMessage.length < 100 && !errorMessage.includes("{") && !errorMessage.includes("[")) {
    return `${errorMessage}. If this keeps happening, please contact our support team.`
  }

  // Default fallback with reporting instructions
  return "We're sorry, something unexpected happened. Please try again. If the problem continues, contact our support team and we'll help you right away."
}

/**
 * Get a user-friendly title for error toasts
 */
export function getErrorTitle(error: any): string {
  if (!error) return "Error"

  const errorMessage = typeof error === "string" ? error : error.message || error.error || ""

  if (errorMessage.includes("uuid") || errorMessage.includes("default")) return "Cannot Delete"
  if (errorMessage.includes("auth") || errorMessage.includes("login") || errorMessage.includes("credentials")) return "Login Failed"
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) return "Connection Error"
  if (errorMessage.includes("payment") || errorMessage.includes("stripe")) return "Payment Error"
  if (errorMessage.includes("not found") || errorMessage.includes("404")) return "Not Found"
  if (errorMessage.includes("permission") || errorMessage.includes("authorized")) return "Access Denied"
  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) return "Invalid Input"

  return "Error"
}

/**
 * Format success messages consistently
 */
export function formatSuccessMessage(action: string, item?: string): string {
  const itemText = item ? ` ${item}` : ""
  
  switch (action.toLowerCase()) {
    case "create":
    case "add":
      return `${item || "Item"} has been added successfully!`
    case "update":
    case "edit":
      return `${item || "Item"} has been updated successfully!`
    case "delete":
    case "remove":
      return `${item || "Item"} has been removed successfully!`
    case "save":
      return `Changes have been saved successfully!`
    default:
      return `${action} completed successfully!`
  }
}
