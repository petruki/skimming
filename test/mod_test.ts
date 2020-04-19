import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import { Input } from "../src/lib/types.ts";
import Skimming from "../mod.ts";

const { test } = Deno;

const content = `
  What is Lorem Ipsum?
  Lorem Ipsum is simply dummy text of the printing and typesetting industry.

  Where does it come from?
  Contrary to popular belief, lorem ipsum is not simply random text.

  Why do we use it?
  It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.`;

test({
  name: "MOD - Should return one valid entry",
  async fn(): Promise<void> {
    const query = "Using cache";
    const files = ["README.md"];
    const input: Input = {
      url: "https://raw.githubusercontent.com/petruki/skimming/master/",
      files,
    };

    const skimmer = new Skimming();
    const entries = await skimmer.skim(input, query, { previewLength: 200 });
    assertEquals(entries.length, 1);
  },
});

test({
  name: "MOD - Should return content found not trimmed",
  fn(): void {
    const query = "Lorem";
    const skimmer = new Skimming();
    const results = skimmer.skimContent(content, query, { previewLength: 100, trimContent: false });
    assertEquals(results[0].length, 100);
  },
});

test({
  name: "MOD - Should return content found trimmed",
  fn(): void {
    const query = "Lorem";
    const skimmer = new Skimming();
    const results = skimmer.skimContent(content, query, { previewLength: 100 });
    assertNotEquals(results[0].length, 100);
  },
});

test({
  name: "MOD - Should return two results - not ignore case",
  fn(): void {
    const query = "Lorem";
    const skimmer = new Skimming();
    const results = skimmer.skimContent(content, query, { previewLength: 20 });
    assertEquals(results.length, 2);
  },
});

test({
  name: "MOD - Should return three results - ignore case",
  fn(): void {
    const query = "Lorem";
    const skimmer = new Skimming();
    const results = skimmer.skimContent(content, query, { previewLength: 20, ignoreCase: true });
    assertEquals(results.length, 3);
  },
});