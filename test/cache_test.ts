import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import CacheHandle from "../src/lib/cache.ts";
import { Input } from "../src/lib/types.ts";

const { test } = Deno;

function sleep(ms: number) {
  return new Promise((fulfill) => setTimeout(fulfill, ms));
}

test({
  name: "CACHE - Should store data into cache",
  fn(): void {
    const cacheHandle = new CacheHandle({ size: 1, expireDuration: 10 });
    cacheHandle.store(
      "my search",
      { file: "filename.md", segment: ["my search begins somewhere here"] },
    );
    assertEquals(cacheHandle.cache.length, 1);
  },
});

test({
  name: "CACHE - Should limit cache size by 2",
  async fn(): Promise<void> {
    const cacheHandle = new CacheHandle({ size: 2, expireDuration: 10 });
    cacheHandle.store(
      "my search",
      { file: "filename.md", segment: ["my search begins somewhere here"] },
    );
    await sleep(500);
    cacheHandle.store(
      "another search",
      {
        file: "filename2.md",
        segment: ["another search begins somewhere here"],
      },
    );
    assertEquals(cacheHandle.cache.length, 2);

    await sleep(500);
    cacheHandle.store(
      "Is there any space",
      { file: "filename3.md", segment: ["Is there any space to store me?"] },
    );
    assertEquals(cacheHandle.cache.length, 2);
  },
});

test({
  name: "CACHE - Should update exp time after accessing cached query",
  async fn(): Promise<void> {
    const cacheHandle = new CacheHandle({ size: 2, expireDuration: 10 });
    cacheHandle.store(
      "my search",
      { file: "filename.md", segment: ["my search begins somewhere here"] },
    );
    await sleep(500);
    cacheHandle.store(
      "another search",
      {
        file: "filename2.md",
        segment: ["another search begins somewhere here"],
      },
    );

    assertEquals(cacheHandle.cache[0].exp < cacheHandle.cache[1].exp, true);

    const input: Input = {
      url: "https://www.skimming.com/docs/",
      files: ["filename2.md"],
    };
    cacheHandle.fetch(input, "my search");
    assertEquals(cacheHandle.cache[0].exp < cacheHandle.cache[1].exp, false);
  },
});

test({
  name:
    "CACHE - Should reorder after one element has been accessed and then another query being added",
  async fn(): Promise<void> {
    const cacheHandle = new CacheHandle({ size: 3, expireDuration: 10 });
    cacheHandle.store(
      "my search",
      { file: "filename.md", segment: ["my search begins somewhere here"] },
    );
    await sleep(500);
    cacheHandle.store(
      "another search",
      {
        file: "filename2.md",
        segment: ["another search begins somewhere here"],
      },
    );

    assertEquals(cacheHandle.cache[0].query, "my search");
    assertEquals(cacheHandle.cache[1].query, "another search");
    const input: Input = {
      url: "https://www.skimming.com/docs/",
      files: ["filename2.md"],
    };
    cacheHandle.fetch(input, "my search");

    // It remains the same order because fetch does not reorder
    assertEquals(cacheHandle.cache[0].query, "my search");
    assertEquals(cacheHandle.cache[1].query, "another search");

    await sleep(500);
    cacheHandle.store(
      "Is there any space",
      { file: "filename3.md", segment: ["Is there any space to store me?"] },
    );

    assertEquals(cacheHandle.cache[0].query, "another search");
    assertEquals(cacheHandle.cache[1].query, "my search");
    assertEquals(cacheHandle.cache[2].query, "Is there any space");
  },
});

test({
  name: "CACHE - Should remove expired data from the cache",
  async fn(): Promise<void> {
    const cacheHandle = new CacheHandle({ size: 10, expireDuration: 1 });
    cacheHandle.store(
      "my search",
      { file: "filename.md", segment: ["my search begins somewhere here"] },
    );
    await sleep(1000);
    cacheHandle.store(
      "another search",
      {
        file: "filename2.md",
        segment: ["another search begins somewhere here"],
      },
    );
    await sleep(500);
    cacheHandle.store(
      "Is there any space",
      { file: "filename3.md", segment: ["Is there any space to store me?"] },
    );

    assertEquals(cacheHandle.cache[0].query, "another search");
    assertEquals(cacheHandle.cache[1].query, "Is there any space");
    assertEquals(cacheHandle.cache.length, 2);
  },
});