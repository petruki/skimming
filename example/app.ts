import { Context, Output } from "../src/lib/types.ts";
import Skimming from "../mod.ts";

function printResult(entries: Output[]) {
  entries.forEach((entry) => {
    console.log(`File: ${entry.file} - Found: ${entry.segment.length} occurrences`);
    entry.segment.forEach((data, index) => {
      console.log(`\nOutput #${index} ---------------\n${data}`);
    });
  });
}

async function main() {
  const files = ["README.md"];
  const context: Context = {
    url: "https://raw.githubusercontent.com/petruki/skimming/master/",
    files,
  };

  const skimmer = new Skimming({ expireDuration: 10, size: 10 });
  skimmer.setContext(context);

  const entries = await skimmer.skim("Skimming", { previewLength: -1 });
  printResult(entries);
}

main();