export function sanitizeContent(content: string): string {
    return content.replace(/[^\w\s\-\.\/\\\(\)\[\]\{\}]/g, '');
}