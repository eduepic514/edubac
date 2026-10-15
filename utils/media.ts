export const getMediaUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  return url; // relative path like /uploads/images/...
};