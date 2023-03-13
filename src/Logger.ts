import chalk from "chalk";

export class Logger {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  private a2s(z: any): string {
    let string = z;
    try {
      string = JSON.parse(string);
    } catch {}

    if (Array.isArray(string)) {
      string = string.join(" ");
    }

    return string;
  }

  info(any: any) {
    const string = this.a2s(any);

    console.log("ℹ️  " + chalk.blue(this.name) + " " + string);
  }

  error(any: any) {
    const string = this.a2s(any);

    console.log("🛑 " + chalk.red(this.name) + " " + string);
  }

  success(any: any) {
    const string = this.a2s(any);

    console.log("✅ " + chalk.green(this.name) + " " + string);
  }

  warning(any: any) {
    const string = this.a2s(any);

    console.log("🚸 " + chalk.yellow(this.name) + " " + string);
  }
}
