import { Alert } from '@mui/material';

export default function ErrorAlert({ message }) {
    if (!message) {
        return null;
    }

    return (
        <Alert
            severity="error"
            sx={{
                mb: 2,
                borderRadius: 2
            }}
        >
            {message}
        </Alert>
    );
}