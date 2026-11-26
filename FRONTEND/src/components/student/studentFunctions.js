// WBS 4.1.1 [Frontend] Implement student account registration
export const isValidAddress = (address) => {
    const words = String(address).toLowerCase().replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/);
    return ['dacanlao', 'calaca', 'batangas'].every((w) => words.includes(w));
}

/* ===== uploaded files ===== */
