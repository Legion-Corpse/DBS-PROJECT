/**
 * Translates raw Oracle Database errors (ORA-XXXXX) into human-friendly messages.
 * Maps common constraint violations and type errors to clear user feedback.
 */
function mapDatabaseError(err) {
    const msg = err.message || '';
    
    // Constraint Violations
    if (msg.includes('ORA-00001')) {
        return 'This information already exists in our system (e.g., username or email).';
    }
    if (msg.includes('ORA-02291')) {
        return 'Selection is invalid. Please ensure all related records exist.';
    }
    if (msg.includes('ORA-02290')) {
        return 'Information provided does not meet our required format or constraints.';
    }

    // Type Errors
    if (msg.includes('ORA-01722')) {
        return 'Invalid numeric format. Please check your inputs.';
    }
    if (msg.includes('ORA-01843') || msg.includes('ORA-01861')) {
        return 'Invalid date format. Please use the date picker.';
    }

    // Schema Errors (Helpful only for developers, but sanitized for users)
    if (msg.includes('ORA-00904')) {
        return 'The system encountered a technical configuration issue. Please contact support.';
    }

    // Default
    return 'An unexpected database error occurred. Please try again later.';
}

module.exports = { mapDatabaseError };
