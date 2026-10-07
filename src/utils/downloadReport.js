import api from './axios';

const filenameFrom = (header, fallback) => {
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header || '');
  return match ? decodeURIComponent(match[1]) : fallback;
};

/**
 * Downloads a file (CSV/PDF) from the API and saves it with the server's file name.
 * Throws an Error with the server's message when the download is refused.
 */
const downloadReport = async (url, params, fallbackName) => {
  try {
    const response = await api.get(url, { params, responseType: 'blob', timeout: 120000 });
    const name = filenameFrom(response.headers['content-disposition'], fallbackName);
    const blobUrl = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    return name;
  } catch (err) {
    // Error bodies arrive as a Blob because of responseType: 'blob'.
    let message = 'Could not download the report. Please try again.';
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const parsed = JSON.parse(await data.text());
        if (parsed?.message) message = parsed.message;
      } catch (parseError) {
        // keep the default message
      }
    } else if (data?.message) {
      message = data.message;
    }
    throw new Error(message);
  }
};

export default downloadReport;
