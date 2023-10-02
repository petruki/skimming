import { Context, Output, Skimming } from '../mod.ts';

function printResult(entries: Output[]) {
  entries.forEach((output) => {
    console.log(`- File: ${output.file} - Found: ${output.found} - Cache: ${output.cache}`);
    output.segment.forEach((data, index) => {
      console.log(
        `\n- Output #${index} -----------------------------\n${data}`,
      );
    });
  });
}

async function main() {
  const files = ['README.md'];
  const context: Context = {
    url: `file:///${Deno.cwd()}/../test/fixtures/`,
    files,
  };

  const skimmer = new Skimming({ expireDuration: 2, size: 10 });
  skimmer.setContext(context);

  console.log('##############################################');
  let output = await skimmer.skim('Skimming({', {
    previewLength: 100,
    trimContent: true,
  });
  printResult(output);

  console.log('##############################################');
  output = await skimmer.skim('Skimming({', {
    previewLength: -1,
    trimContent: true,
  });
  printResult(output);

  console.log('##############################################');
  output = await skimmer.skim('#{3}', { previewLength: -1, regex: true });
  printResult(output);
}

main();
