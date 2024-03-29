const { obfuscate } = require("javascript-obfuscator");
import { Logger } from "./Logger";
import { UniverseWS } from "./Server";
import User from "./User";

export class Antibot {
  static logger = new Logger("Antibot");

  clientChecks = [
    ["MPP.client.isConnected()", "true"],
    ["MPP.client.isConnecting()", "false"],
    ["MPP.client.user", "undefined"],
    ["MPP.client.channel", "undefined"],
    ["MPP.client.connectionTime", "undefined"],
    ["Object.keys(MPP.client.ppl).length", "0"],
    ["MPP.client.preventsPlaying()", "false"],
    ["MPP.client.participantId", "undefined"],
    ["MPP.client.canConnect", "true"]
  ];

  checkSolves: string[] = [];
  solves: string[][] = [];

  hash = Math.floor(Math.random() * 999);

  verifiedDevices = false;

  constructor() {
    for (let i = 0; i < 3; i++) {
      this.solves.push(this.clientChecks[Math.floor(Math.random() * this.clientChecks.length)]);
    }

    for (let i = 0; i < this.solves.length; i++) {
      this.checkSolves.push(Math.floor(Math.random() * 999) + "");
    }
  }

  verifyMessage(c: UniverseWS, data: any) {
    if (data.m == "devices") {
      this.verifiedDevices = true;
    }

    if (data.m == "hi") {
      if (data.token) {
        let dd = User.getToken(data.token);

        if (dd.length != 0) {
          const user = new User(dd[0]._id);
          if (user.permissions.hasPermission("antibot.bypass")) return false;
        }
      }

      if (!data.code || !this.verifiedDevices || !this.verifyCode(data.code)) {
        return true;
      }
    }
  }

  generateCode() {

    let clientChecksCode = this.solves.map((z, i) => {
      return `if(${z[0]} == ${z[1]}) parts.push("${this.checkSolves[i]}")`;
    });

    return obfuscate(
      `
                let parts = [];
                ${clientChecksCode.join(";\n")}
                return ${this.hash}*parts.map(z => z.split("").map(z => z.charCodeAt(0)).reduce((a, b)=>a+b)).reduce((a, b) => a + b);
            `,
      {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 0.52,
      },
    ).getObfuscatedCode();
  }

  verifyCode(code: number) {
    let solve = this.hash *
      this.checkSolves.map((z) =>
        z.split("").map((z) => z.charCodeAt(0)).reduce((a, b) => a + b)
      ).reduce((a, b) => a + b);

      if (solve !== code) {
      Antibot.logger.warning(
        "Antibot failed! Code:",
        code,
        "Needed:",
        solve,
        "Hash:",
        this.hash,
        "Solves:",
        this.solves,
      );
    }
    return solve == code;
  }
}
