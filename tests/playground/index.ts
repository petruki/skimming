import { type Output, Skimming } from '../../mod.ts';

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

async function _testSimple() {
  const skimmer = Skimming.create({
    url: `file:///${Deno.cwd()}/tests/fixtures/`,
    files: ['README.md'],
  });

  const output = await skimmer.skim('Skimming is');
  printResult(output);
}

async function _testTrimPreview() {
  const skimmer = Skimming.create({
    url: `file:///${Deno.cwd()}/tests/fixtures/`,
    files: ['README.md'],
  });

  const output = await skimmer.skim('Skimming is', { previewLength: 100 });
  printResult(output);
}

async function _testRegex() {
  const skimmer = Skimming.create({
    url: `file:///${Deno.cwd()}/tests/fixtures/`,
    files: ['README.md'],
  });

  const output = await skimmer.skim('[###]', { regex: true, previewLength: -1 });
  printResult(output);
}

function _testSearchContent() {
  const content = `
    # Skimming
    It is a tool to skim through content and find what you are looking for.
  `;

  const skimmer = Skimming.create();

  const output = skimmer.skimContent(content, 'skim', { previewLength: 0 });
  console.log(output);
}

_testSearchContent();
