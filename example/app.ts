import { Input, Output } from "../src/lib/types.ts";
import Skimming from "../mod.ts";

function printResult(entries: Output[]) {
  entries.forEach((entry) => {
    console.log(`File: ${entry.file} - Found: ${entry.segment.length}`);
    entry.segment.forEach((data) => {
      console.log(`########\n${data}`);
    });
  });
}

async function main(query: string) {
  const files = ["readme.md"];
  const input: Input = {
    url: "https://raw.githubusercontent.com/petruki/switcher-api/master/",
    files,
  };

  const skimmer = new Skimming({ expireDuration: 10, size: 10 });

  const entries = await skimmer.skim(input, query, { previewLength: 150 });
  printResult(entries);
}

main("criteria");