
function isValidUrl(urlString) {
    try {
        new URL(urlString);
        return true;
    } catch (e) {
        return false;
    }
}


function isJsonObject(data) {
    return typeof data === 'object' && data !== null && !Array.isArray(data);
}

module.exports = {
    isValidUrl,
    isJsonObject
};
