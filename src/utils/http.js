export function handleAxiosError(error) {
    if (error.response && error.response.data.hasOwnProperty('msg')) {
        return new Error(error.response.data.msg);
    } else {
        return new Error(error);
    }
}

export function handleApiError(response) {
    if (response.data.hasOwnProperty('msg')) {
        return new Error(response.data.msg);
    } else {
        return new Error('Unknow error');
    }
}