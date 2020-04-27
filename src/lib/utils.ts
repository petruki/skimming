import { Context } from "./types.ts";
import { InvalidQuery, InvalidContext } from "./exceptions.ts";
import { DEFAULT_TRIM, DEFAULT_PREVIEW_LENGTH } from "../skimming.ts";

export const LINE_BREAK = "\n";
export const EXCAPE_REGEX = /[.*+?^${}()|[\]\\]/g;

export function validateQuery(query: string, limit?: number): void {
  if (!query.length) {
    throw new InvalidQuery("it is empty");
  }

  if (limit && query.length > limit) {
    throw new InvalidQuery(`it exceeds the limit of ${limit}`);
  }
}

export function validateContext(context: Context): void {
  if (!context.url.length) {
    throw new InvalidContext("url is empty");
  }

  context.files.forEach(file => {
    if (!file.length) {
      throw new InvalidContext("file name is empty");
    } else {
      if (!context.url.endsWith("/") && !file.startsWith("/")) {
        throw new InvalidContext(`this enpoint might not work: ${context.url}${file}`);
      }
    }
  });
}

export function extractSegment(
  from: string, query: string, 
  previewLength: number = DEFAULT_PREVIEW_LENGTH, 
  trimContent: boolean = DEFAULT_TRIM
  ): string {
    
  let offset;
  if (previewLength === -1) {
    offset = from.substring(0, from.indexOf(LINE_BREAK));
  } else {
    offset = from.substring(0, previewLength === 0 ? query.length : previewLength);
  }

  const lastLine = offset.lastIndexOf(LINE_BREAK);

  /* Extract content segment from the found query to the last complete line,
   * However, if the previewLenght is shorter than the size of this line, it will display the established range.
   */
  return trimContent ? offset.substring(0, lastLine > 0 ? lastLine : offset.length) : offset;
}