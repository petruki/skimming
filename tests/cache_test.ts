import { assertEquals } from './deps.ts';
import CacheHandler from '../src/lib/cache.ts';
import { DEFAULT_IGNORE_CASE, DEFAULT_PREVIEW_LENGTH } from '../src/skimming.ts';

const { test } = Deno;

function sleep(ms: number) {
  return new Promise((fulfill) => setTimeout(fulfill, ms));
}

test({
  name: 'CACHE - Should store data into cache',
  fn(): void {
    // given
    const cacheHandler = new CacheHandler({ size: 1, expireDuration: 10 });

    // test
    cacheHandler.store(
      'my search',
      {
        file: 'filename.md',
        segment: ['my search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );
    assertEquals(cacheHandler.cache.length, 1);
  },
});

test({
  name: 'CACHE - Should limit cache size by 2',
  async fn(): Promise<void> {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 10 });

    // test
    cacheHandler.store(
      'my search',
      {
        file: 'filename.md',
        segment: ['my search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    await sleep(500);
    cacheHandler.store(
      'another search',
      {
        file: 'filename2.md',
        segment: ['another search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );
    assertEquals(cacheHandler.cache.length, 2);

    await sleep(500);
    cacheHandler.store(
      'Is there any space',
      {
        file: 'filename3.md',
        segment: ['Is there any space to store me?'],
        found: 1,
        cache: true,
      },
    );
    assertEquals(cacheHandler.cache.length, 2);
  },
});

test({
  name: 'CACHE - Should update exp time after accessing cached query',
  async fn(): Promise<void> {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 10 });

    // test
    cacheHandler.store(
      'my search',
      {
        file: 'filename.md',
        segment: ['my search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    await sleep(500);
    cacheHandler.store(
      'another search',
      {
        file: 'filename2.md',
        segment: ['another search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    assertEquals(cacheHandler.cache[0].exp < cacheHandler.cache[1].exp, true);

    cacheHandler.fetch('my search');
    assertEquals(cacheHandler.cache[0].exp < cacheHandler.cache[1].exp, false);
  },
});

test({
  name: 'CACHE - Should fetch from cache when ignore case enabled',
  fn(): void {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 10 });

    cacheHandler.store(
      'My Search',
      {
        file: 'filename.md',
        segment: ['My Search begins somewhere here'],
        found: 1,
        cache: true,
      },
      {
        ignoreCase: true,
      },
    );

    // test
    const output = cacheHandler.fetch('my search', { ignoreCase: true });
    assertEquals(output.length, 1);
    assertEquals(cacheHandler.cache[0].query, 'my search');
  },
});

test({
  name: 'CACHE - Should fetch from remote when ignore case enabled',
  async fn(): Promise<void> {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 1 });

    cacheHandler.store(
      'My Search',
      {
        file: 'filename.md',
        segment: ['My Search begins somewhere here'],
        found: 1,
        cache: true,
      },
      {
        ignoreCase: true,
      },
    );

    // test
    let output = cacheHandler.fetch('my search', { ignoreCase: true });
    assertEquals(output.length, 1);
    await sleep(1500);

    output = cacheHandler.fetch('my search', { ignoreCase: true });
    assertEquals(output.length, 0);
  },
});

test({
  name: 'CACHE - Should fetch from source once FetchOptions (previewLength) has changed',
  fn(): void {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 10 });
    const previewLength = 10;

    cacheHandler.store(
      'My Search',
      {
        file: 'filename.md',
        segment: ['My Search begins somewhere here'],
        found: 1,
        cache: true,
      },
      {
        previewLength,
      },
    );

    // test
    const output = cacheHandler.fetch('My Search', { previewLength: 5 });
    assertEquals(output.length, 0);
  },
});

test({
  name: 'CACHE - Should fetch from source once FetchOptions (trimContent) has changed',
  fn(): void {
    // given
    const cacheHandler = new CacheHandler({ size: 2, expireDuration: 10 });
    const trimContent = true;

    cacheHandler.store(
      'My Search',
      {
        file: 'filename.md',
        segment: ['My Search begins somewhere here'],
        found: 1,
        cache: true,
      },
      {
        trimContent,
        previewLength: DEFAULT_PREVIEW_LENGTH,
        ignoreCase: DEFAULT_IGNORE_CASE,
      },
    );

    // test
    const output = cacheHandler.fetch('My Search', { trimContent: false });
    assertEquals(output.length, 0);
  },
});

test({
  name: 'CACHE - Should reorder after one element has been accessed and then another query has been added',
  async fn(): Promise<void> {
    // given
    const cacheHandler = new CacheHandler({ size: 3, expireDuration: 10 });

    // test
    cacheHandler.store(
      'my search',
      {
        file: 'filename.md',
        segment: ['my search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );
    await sleep(500);
    cacheHandler.store(
      'another search',
      {
        file: 'filename2.md',
        segment: ['another search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    assertEquals(cacheHandler.cache[0].query, 'my search');
    assertEquals(cacheHandler.cache[1].query, 'another search');

    cacheHandler.fetch('my search');

    // It remains the same order because fetch does not reorder
    assertEquals(cacheHandler.cache[0].query, 'my search');
    assertEquals(cacheHandler.cache[1].query, 'another search');

    await sleep(500);
    cacheHandler.store(
      'Is there any space',
      {
        file: 'filename3.md',
        segment: ['Is there any space to store me?'],
        found: 1,
        cache: true,
      },
    );

    assertEquals(cacheHandler.cache[0].query, 'another search');
    assertEquals(cacheHandler.cache[1].query, 'my search');
    assertEquals(cacheHandler.cache[2].query, 'Is there any space');
  },
});

test({
  name: 'CACHE - Should remove expired data from the cache',
  async fn(): Promise<void> {
    // given
    const cacheHandler = new CacheHandler({ size: 10, expireDuration: 1 });

    // test
    cacheHandler.store(
      'my search',
      {
        file: 'filename.md',
        segment: ['my search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    await sleep(1000);
    cacheHandler.store(
      'another search',
      {
        file: 'filename2.md',
        segment: ['another search begins somewhere here'],
        found: 1,
        cache: true,
      },
    );

    await sleep(500);
    cacheHandler.store(
      'Is there any space',
      {
        file: 'filename3.md',
        segment: ['Is there any space to store me?'],
        found: 1,
        cache: true,
      },
    );

    assertEquals(cacheHandler.cache[0].query, 'another search');
    assertEquals(cacheHandler.cache[1].query, 'Is there any space');
    assertEquals(cacheHandler.cache.length, 2);
  },
});
