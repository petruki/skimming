import { assertEquals, assertNotEquals, assertThrows, assertThrowsAsync } from "https://deno.land/std/testing/asserts.ts";
import { Context } from "../src/lib/types.ts";
import Skimming from "../mod.ts";
import { InvalidQuery, InvalidContext } from "../src/lib/exceptions.ts";

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
    const query = "Skimming";
    const files = ["README.md"];
    const context: Context = {
      url: "https://raw.githubusercontent.com/petruki/skimming/master/",
      files,
    };

    const skimmer = new Skimming();
    skimmer.setContext(context);
    const entries = await skimmer.skim(query, { previewLength: 200 });
    assertEquals(entries.length, 1);
  },
});

test({
  name: "MOD - Should NOT return - Exception: empty query",
  async fn(): Promise<void> {
    const query = '';
    const files = ["README.md"];
    const context: Context = {
      url: "https://raw.githubusercontent.com/petruki/skimming/master/",
      files,
    };

    const skimmer = new Skimming();
    skimmer.setContext(context);
    assertThrowsAsync(async () => { await skimmer.skim(query); }, 
      InvalidQuery, `Invalid query input. Cause: ${"it is empty"}.`);
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

test({
  name: "MOD - Should NOT return - Exception: url is empty",
  async fn(): Promise<void> {
    const files = ["README.md"];
    const context: Context = {
      url: "",
      files,
    };

    const skimmer = new Skimming();
    assertThrows(() => {  skimmer.setContext(context); }, 
      InvalidContext, `Invalid context. Cause: ${"url is empty"}.`);
  },
});

test({
  name: "MOD - Should NOT return - Exception: file name is empty",
  async fn(): Promise<void> {
    const files = [""];
    const context: Context = {
      url: "https://raw.githubusercontent.com/petruki/skimming/master/",
      files,
    };

    const skimmer = new Skimming();
    assertThrows(() => {  skimmer.setContext(context); }, 
      InvalidContext, `Invalid context. Cause: ${"file name is empty"}.`);
  },
});

test({
  name: "MOD - Should NOT return - Exception: endpoint might not work",
  async fn(): Promise<void> {
    const files = ["README.md"];
    const context: Context = {
      url: "https://raw.githubusercontent.com/petruki/skimming/master", // Here, it is missing a slash in the end
      files,
    };

    const skimmer = new Skimming();
    assertThrows(() => {  skimmer.setContext(context); }, 
      InvalidContext, `Invalid context. Cause: this enpoint might not work: ${context.url}${"README.md"}.`);
  },
});