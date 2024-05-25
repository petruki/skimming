import { assertEquals, assertNotEquals, assertThrows } from './deps.ts';
import { type Context, Skimming } from '../mod.ts';
import { InvalidContext } from '../src/lib/exceptions.ts';

const { test } = Deno;

const content = `
  What is Lorem Ipsum?
  Lorem Ipsum is simply dummy text of the printing and typesetting industry.

  Where does it come from?
  Contrary to popular belief, lorem ipsum is not simply random text.

  Why do we use it?
  It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.`;

test({
  name: 'MOD - Should return one valid entry',
  async fn(): Promise<void> {
    // given
    const query = 'Skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
    };

    const skimmer = Skimming.create(context);

    // test
    const entries = await skimmer.skim(query, { previewLength: 200 });
    assertEquals(entries.length, 1);
  },
});

test({
  name: 'MOD - Should NOT return - Exception: document not found',
  async fn(): Promise<void> {
    // given
    const query = 'query';
    const files = ['NOT_EXIST.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
    };

    const skimmer = Skimming.create(context);

    // test
    await skimmer.skim(query).catch((error) => {
      assertEquals(error.name, 'NotContentFound');
      assertEquals(
        error.message,
        `No content found at https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/${files[0]}.`,
      );
    });
  },
});

test({
  name: 'MOD - Should NOT return - Exception: empty query',
  fn(): void {
    // given
    const query = '';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
    };

    const skimmer = Skimming.create(context);

    // test
    skimmer.skim(query).catch((error) => {
      assertEquals(error.name, 'InvalidQuery');
      assertEquals(
        error.message,
        `Invalid query input. Cause: ${'it is empty'}.`,
      );
    });
  },
});

test({
  name: 'MOD - Should return content found not trimmed',
  fn(): void {
    // given
    const query = 'Lorem';
    const skimmer = Skimming.create();

    // test
    const results = skimmer.skimContent(content, query, {
      previewLength: 100,
      trimContent: false,
    });
    assertEquals(results[0].length, 100);
  },
});

test({
  name: 'MOD - Should return content found trimmed',
  fn(): void {
    // given
    const query = 'Lorem';
    const skimmer = Skimming.create();

    // test
    const results = skimmer.skimContent(content, query, { previewLength: 100 });
    assertNotEquals(results[0].length, 100);
  },
});

test({
  name: 'MOD - Should return two results - not ignore case',
  fn(): void {
    // given
    const query = 'Lorem';
    const skimmer = Skimming.create();

    // test
    const results = skimmer.skimContent(content, query, { previewLength: 20 });
    assertEquals(results.length, 2);
  },
});

test({
  name: 'MOD - Should return three results - ignore case',
  fn(): void {
    // given
    const query = 'Lorem';
    const skimmer = Skimming.create();

    // test
    const results = skimmer.skimContent(content, query, {
      previewLength: 20,
      ignoreCase: true,
    });
    assertEquals(results.length, 3);
  },
});

test({
  name: 'MOD - Should NOT return - Exception: url is empty',
  fn(): void {
    // given
    const files = ['README.md'];
    const context: Context = {
      url: '',
      files,
    };

    // test
    assertThrows(
      () => Skimming.create(context),
      InvalidContext,
      'Invalid context. Cause: url must not be empty.',
    );
  },
});

test({
  name: 'MOD - Should NOT return - Exception: file name is empty',
  fn(): void {
    // given
    const files = [''];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
    };

    // test
    assertThrows(
      () => Skimming.create(context),
      InvalidContext,
      'Invalid context. Cause: files must not be empty.',
    );
  },
});

test({
  name: 'MOD - Should return value from the cache',
  async fn(): Promise<void> {
    // given
    const query = 'Skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    let output = await skimmer.skim(query);
    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, false);
    });

    output = await skimmer.skim(query);
    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, true);
    });
  },
});

test({
  name: 'MOD - Should NOT return value from the cache - when skip cache is enabled',
  async fn(): Promise<void> {
    // given
    const query = 'Skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    let output = await skimmer.skim(query);
    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, false);
    });

    output = await skimmer.skim(query, { skipCache: true });
    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, false);
    });
  },
});

test({
  name: 'MOD - Should return value from the cache with new preview length',
  async fn(): Promise<void> {
    // given
    const query = 'Skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    let output = await skimmer.skim(query, {
      previewLength: 20,
      trimContent: false,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => assertEquals(data.segment[0].length, 20));

    output = await skimmer.skim(query, {
      previewLength: 10,
      trimContent: false,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => assertEquals(data.segment[0].length, 10));
  },
});

test({
  name: 'MOD - Should return value from the cache with ignore case',
  async fn(): Promise<void> {
    // given
    const query1 = 'Skimming';
    const query2 = 'skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    let output = await skimmer.skim(query1, {
      previewLength: 20,
      trimContent: false,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => assertEquals(data.segment[0].length, 20));

    output = await skimmer.skim(query2, {
      previewLength: 20,
      trimContent: false,
      ignoreCase: true,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => assertEquals(data.segment[0].length, 20));
  },
});

test({
  name: 'MOD - Should return value from the source with new preview length',
  async fn(): Promise<void> {
    // given
    const query = 'Skimming';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    let output = await skimmer.skim(query, {
      previewLength: 20,
      trimContent: false,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, false);
      assertEquals(data.segment[0].length, 20);
    });

    // preview length now is greater than the previous value
    output = await skimmer.skim(query, {
      previewLength: 30,
      trimContent: false,
    });

    assertEquals(output.length, 1);
    output.forEach((data) => {
      assertEquals(data.cache, false);
      assertEquals(data.segment[0].length, 30);
    });
  },
});

test({
  name: 'MOD - Should return value using regular expression',
  async fn(): Promise<void> {
    // given
    const query = '#{3}';
    const files = ['README.md'];
    const context: Context = {
      url: 'https://raw.githubusercontent.com/petruki/skimming/master/test/fixtures/',
      files,
      cacheOptions: { size: 10, expireDuration: 10 },
    };

    const skimmer = Skimming.create(context);

    // test
    const output = await skimmer.skim(query, {
      previewLength: -1,
      regex: true,
    });

    assertEquals(output.length, 1);
    assertEquals(output[0].segment[0], '### No cache');
    assertEquals(output[0].segment[1], '### Using cache');
    assertEquals(output[0].segment[2], '### Testing');
  },
});
