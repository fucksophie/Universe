import { readdir } from "fs/promises";
import Channel from "./Channel";
import Participiant from "./Participiant";
import { UniverseWS } from "./Server";

interface Command {
  eval(args: string[], channel: Channel, part: Participiant);
  defaultPermission: boolean;
  name: string;
  usage: string;
  description: string;
}
const commands: Command[] = [];

for (const file of await readdir("src/commands")) {
  let command = await import("./commands/" + file);
  if (!command.default) {
    console.log(file + " seems to be a invalid command. IT WILL NOT RUN.");
    continue;
  }
  commands.push(command.default);
}

export default function parseCommand(ws: UniverseWS, message: string) {
  let ch = ws.client.channel;
  let part = ch.participants.get(ws.client._id);

  let args = message.split(" ").map((z) => z.trim().replaceAll("  ", " "));
  let command = args.shift();

  if (command.slice(0, 1) !== "~") return;

  let cmd = commands.find((z) => z.name == command.slice(1));

  if (!cmd) {
    ch.dmAsServer(part, "Command does not exist.");
    return;
  }

  if (cmd.defaultPermission) {
    if (!part.user.permissions.hasPermission("command." + cmd.name)) {
      ch.dmAsServer(part, "You are missing permissions.");
      return;
    }
  }
  
  let parts = cmd.usage.split(" ");
  if(cmd.usage.length == 0) parts = [];

  if (!(args.length >= parts.length)) {
    ch.dmAsServer(part, cmd.description);
    ch.dmAsServer(part, "Usage: ~" + cmd.name + " " + cmd.usage);
    return;
  }
  cmd.eval(args, ch, part);
}
