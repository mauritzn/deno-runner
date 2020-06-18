export function existsSync(filePath: string): boolean {
  try {
    Deno.lstatSync(filePath);
    return true;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return false;
    }
    throw err;
  }
}

type Colors =
  | "black"
  | "red"
  | "green"
  | "yellow"
  | "blue"
  | "magenta"
  | "cyan"
  | "white";
const logColors: { [colorName: string]: string } = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};
export function colorLog(text: string | string[], color: Colors = "white") {
  const logColor = (color in logColors ? logColors[color] : logColors["white"]);
  if (typeof text === "string") {
    console.log(`${logColor}${text}\x1b[0m`);
  } else {
    console.log(`${logColor}${text[0]}\x1b[0m`, text[1]);
  }
}

export function logError(text: string) {
  colorLog(["error:", text], "red");
  return false;
}
