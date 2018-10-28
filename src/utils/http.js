export function handleAxiosError(error) {
    if (error.response && error.response.data.hasOwnProperty('error')) {
        return new Error(error.response.data.error);
    } else {
        return error;
    }
}

export function handleApiError(response) {
    if (response.data.hasOwnProperty('error')) {
        return new Error(response.data.error);
    } else {
        return new Error('Unknow error');
    }
}