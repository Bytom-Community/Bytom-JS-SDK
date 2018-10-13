export function handleAxiosError(error) {
    if (error.response) {
        return new Error(error.response.data.error);
    } else {
        return error;  
    }
}