import { Context, Output } from "../src/lib/types.ts";
import Skimming from "../mod.ts";

function sleep(ms: number) {
  return new Promise((fulfill) => setTimeout(fulfill, ms));
}

function printResult(entries: Output[]) {
  entries.forEach((output) => {
    console.log(`File: ${output.file} - Found: ${output.found} - Cache: ${output.cache}`);
    output.segment.forEach((data, index) => {
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

  const skimmer = new Skimming({ expireDuration: 2, size: 10 });
  skimmer.setContext(context);

  let entries = await skimmer.skim("Skimming()", { previewLength: 30, trimContent: false });
  printResult(entries);

  console.log('##########################')
  entries = await skimmer.skim("Skimming()", { previewLength: 30, trimContent: false });
  printResult(entries);

  await sleep(1000);

  console.log('##########################')
  entries = await skimmer.skim("Skimming()", { previewLength: 20, trimContent: false });
  printResult(entries);
}

main();