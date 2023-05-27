import { assertEquals, assertThrows } from "./deps.ts";
import { extractSegment, validateQuery } from "../src/lib/utils.ts";
import { InvalidQuery } from "../src/lib/exceptions.ts";

const { test } = Deno;

const content = "What is Lorem Ipsum?";

test({
  name: "UTILS - Should return error when limit exceeded",
  fn(): void {
    assertThrows(() => validateQuery("query", 3), 
      InvalidQuery, "Invalid query input. Cause: it exceeds the limit of 3.");
  },
});

test({
  name: "UTILS - Should return error when query is empty",
  fn(): void {
    assertThrows(() => validateQuery(""), 
      InvalidQuery, "Invalid query input. Cause: it is empty.");
  },
});

test({
  name: "UTILS - Should extract segment full line",
  fn(): void {
    const segment = extractSegment(content, "What", -1);
    assertEquals(segment, "What is Lorem Ipsum?")
  },
});

test({
  name: "UTILS - Should extract segment from query lenght",
  fn(): void {
    const segment = extractSegment(content, "What", 0, false);
    assertEquals(segment, "What")
  },
});