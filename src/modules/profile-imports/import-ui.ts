export function canPreviewImport(content: string, busy: boolean) {
  return !busy && content.trim().length > 0;
}
