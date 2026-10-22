export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
    if (!error) {
        return fallback;
    }

    if (!error.response) {
        return 'Unable to connect to the server. Please check your connection.';
    }

    const status = error.response.status;

    if (status === 400) {
        return error.response.data?.message || 'Invalid request.';
    }

    if (status === 401) {
        return 'Your session has expired. Please login again.';
    }

    if (status === 403) {
        return 'You do not have permission to perform this action.';
    }

    if (status === 404) {
        return 'The requested resource was not found.';
    }

    if (status === 409) {
        return error.response.data?.message || 'This operation conflicts with existing data.';
    }

    if (status >= 500) {
        return 'Server error. Please try again later.';
    }

    return error.response.data?.message || fallback;
}