import { Context } from './types.ts';
import { InvalidContext, InvalidQuery } from './exceptions.ts';
import { DEFAULT_NEXT, DEFAULT_PREVIEW_LENGTH, DEFAULT_REGEX, DEFAULT_TRIM } from '../skimming.ts';

export const LINE_BREAK = '\n';
export const LAST_LINE = '$';
export const REGEX_ESCAPE = /[.*+?^${}()|[\]\\]/g;

export function validateQuery(query: string, limit?: number): void {
  if (!query.length) {
    throw new InvalidQuery('it is empty');
  }

  if (limit && query.length > limit) {
    throw new InvalidQuery(`it exceeds the limit of ${limit}`);
  }
}

export function validateContext(context: Context): void {
  if (!context?.url.length) {
    throw new InvalidContext(
      'context is not defined properly - use setContext() to define the context',
    );
  }

  context.files.forEach((file) => {
    if (!file.length) {
      throw new InvalidContext('file name is empty');
    } else if (!context.url.endsWith('/') && !file.startsWith('/')) {
      throw new InvalidContext(
        `this enpoint might not work: ${context.url}${file}`,
      );
    }
  });
}

/**
 * Return the segment to be displayed based on the segment rules
 *
 * @param from where the content must be extracted
 * @param query used to limit the segment size when previewLength is zero
 * @param previewLength number of characters that must be displayed
 * @param trimContent find the next line break within the defined preview length
 */
export function extractSegment(
  from: string,
  query: string,
  previewLength: number = DEFAULT_PREVIEW_LENGTH,
  trimContent: boolean = DEFAULT_TRIM,
): string {
  let offset;
  if (previewLength === -1) {
    // Find the last line position
    const lastPos = from.trimStart().search(LINE_BREAK);
    offset = from.substring(
      0,
      lastPos > 0 ? lastPos + 1 : from.search(LAST_LINE),
    );
  } else if (trimContent) {
    offset = from.trimStart().substring(
      0,
      from.trimStart().indexOf(LINE_BREAK) + previewLength,
    );
  } else {
    offset = from.trimStart().substring(
      0,
      previewLength === 0 ? query.length : previewLength,
    );
  }

  // Find the last line position in a multiline content
  const lastLine = offset.lastIndexOf(LINE_BREAK);

  /* Extract content segment from the found query to the last complete line,
   * However, if the previewLenght is shorter than the size of this line, it will display the established range.
   */
  if (trimContent) {
    return offset.substring(0, lastLine > 0 ? lastLine : offset.length).trim();
  }

  return offset.trim();
}

/**
 * Return the starting position where a segment must be displayed

 * @param trimContent if true, it will try to find the first line break or content starting position
 * @param regex if true, it will prepare the query to use regex notation
 * @param next if true, it will continue from where it stopped
 */
export function findFirstPos(
  contentToFetch: string,
  query: string,
  trimContent: boolean = DEFAULT_TRIM,
  regex: boolean = DEFAULT_REGEX,
  next: boolean = DEFAULT_NEXT,
): number {
  const foundIndex = regex ? contentToFetch.search(query) : contentToFetch.search(query.replace(REGEX_ESCAPE, '\\$&'));

  if (trimContent && foundIndex != -1) {
    let firstPos = next ? foundIndex : 0;
    for (let index = foundIndex; index >= 0; index--) {
      if (contentToFetch.charAt(index) == '\n') {
        firstPos = index;
        break;
      }
    }
    return firstPos;
  }

  return foundIndex;
}
