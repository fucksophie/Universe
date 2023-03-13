import chalk from "chalk";

function rainbow(len = 24, pastel = false) {
  let eq1 = 127;
  let eq2 = 128;

  if (pastel) {
    eq1 = 55;
    eq2 = 200;
  }

  const frequency = Math.PI * 2 / len;

  return new Array(len).fill("").map((_, i) => {
    return {
      r: Math.sin(frequency * i + 2) * eq1 + eq2,
      g: Math.sin(frequency * i + 0) * eq1 + eq2,
      b: Math.sin(frequency * i + 4) * eq1 + eq2,
    };
  });
}

async function sizes() {
  const cols = +(await new Response(Bun.spawn(["tput", "cols"]).stdout).text())
    .trim();
  const rows = +(await new Response(Bun.spawn(["tput", "lines"]).stdout).text())
    .trim();

  return { cols, rows };
}

const { cols } = await sizes();

let lines = rainbow(
  (await Bun.file("other/ascii_lg.txt").text()).split("").length,
  false,
).map((z) => chalk.rgb(Math.floor(z.r), Math.floor(z.g), Math.floor(z.b)));

export async function display() {
  let ascii = "";
  try {
    if (cols >= 115) {
      ascii = await Bun.file("other/ascii_lg.txt").text();
    } else if (cols >= 71) {
      ascii = await Bun.file("other/ascii_md.txt").text();
    } else if (cols >= 46) {
      ascii = await Bun.file("other/ascii_sm.txt").text();
    }
  } finally {
    if (ascii) {
      ascii.split("\n").forEach((l, i) => {
        console.log(
          `${l.split("").map((z, y) => lines[y * 4 ^ i](z)).join("")}`,
        );
      });
    }
  }
}
