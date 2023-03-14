import { generateHeapSnapshot } from "bun";
import { getProtectedObjects } from "bun:jsc";
import Hashing from "./Hashing";
import { rankDefinitions } from "./Permissions";
import Server, { UniverseWS, verifyColor } from "./Server";
import User from "./User";

export default function parseCommand(ws: UniverseWS, message: string) {
  let ch = ws.client.channel;
  let part = ch.getPart(ws.client);

  let args = message.split(" ").map((z) => z.trim().replaceAll("  ", " "));
  let command = args.shift();

  if (command == "~muhe") {
    ch.dmAsServer(part, "MUHE TIME!!!!");
  }

  if (command == "~heap") {
    (async () => {
      const snapshot = generateHeapSnapshot();
      await Bun.write("heap" + Date.now() + ".json", JSON.stringify(snapshot));
      ch.messageAsServer("heap snapshot saved.");
    })();
  }
  if (command == "~id") {
    ch.dmAsServer(
      part,
      "Your ID is \`" + part._id + "\`, id is \`" + part.pID + "\`",
    );
  }

  if (command == "~experms") {
    if (!part.user.permissions.hasPermission("command.experms")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0]) {
      ch.dmAsServer(
        part,
        "This command lists the explicit permissions of a user, ones that aren't in a rank.",
      );
      return;
    }

    let user = User.userExists(args[0])?.[0];
    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    ch.dmAsServer(
      part,
      `${user.name} (${user._id})'s permissions: \`${
        JSON.parse(user.permissions).join("\`, \`")
      }\``,
    );
  }

  if (command == "~perms") {
    if (!part.user.permissions.hasPermission("command.perms")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }

    if (!args[0]) {
      ch.dmAsServer(
        part,
        "This command lists the computed permissions of a user, including ranks.",
      );
      return;
    }

    let user = User.userExists(args[0])?.[0];
    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    const usr = new User(user._id);

    ch.dmAsServer(
      part,
      `${user.name} (${user._id})'s permissions: \`${
        [...usr.permissions.getPermissions()].join("\`, \`")
      }\``,
    );
  }

  if (command == "~generateToken") {
    if (!part.user.permissions.hasPermission("command.generateToken")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }

    const id = new User(Hashing.idHashing(crypto.randomUUID()));
    id.ranks.add("bot");
    id.commit();

    ch.dmAsServer(part, "Token for your bot: " + id.token + ", ID: " + id._id);
  }
  if (command == "~delrank") {
    if (!part.user.permissions.hasPermission("command.delrank")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0] || !args[1]) {
      ch.dmAsServer(part, "This command removes a rank from a user!");
      ch.dmAsServer(part, "Usage: ~delrank " + part._id + " owner");
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    if (!rankDefinitions[args[1]]) {
      ch.dmAsServer(
        part,
        `Rank does not exist. Available ranks: ${
          Object.keys(rankDefinitions).join(", ")
        }`,
      );
      return;
    }

    user.ranks.delete(args[1]);
    user.commit();

    ch.dmAsServer(
      part,
      "Removed user's `" + user.name + "` rank: `" + args[1] + "`!",
    );
  }

  if (command == "~addrank") {
    if (!part.user.permissions.hasPermission("command.addrank")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0] || !args[1]) {
      ch.dmAsServer(part, "This command adds a rank to a user!");
      ch.dmAsServer(part, "Usage: ~addrank " + part._id + " owner");
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    // EXPLANATION:
    // user is not online. no particpiant to update.
    // BUT, we can check if the user exists in the database
    // if he does, we fetch him via new User.
    // later on, if he doesn't exist even in the database, we tell the
    // executor, that he don't exist. 300iq.

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    if (!rankDefinitions[args[1]]) {
      ch.dmAsServer(
        part,
        `Rank does not exist. Available ranks: ${
          Object.keys(rankDefinitions).join(", ")
        }`,
      );
      return;
    }

    user.ranks.add(args[1]);
    user.commit();

    ch.dmAsServer(
      part,
      "Granted user `" + user.name + "` rank: `" + args[1] + "`!",
    );
  }

  if (command == "~ranks") {
    if (!part.user.permissions.hasPermission("command.ranks")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0]) {
      ch.dmAsServer(part, "This command lists all the ranks of a user.");
      return;
    }

    let user = User.userExists(args[0])?.[0];
    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    ch.dmAsServer(
      part,
      `${user.name} (${user._id})'s ranks: \`${
        JSON.parse(user.ranks).join("\`, \`")
      }\``,
    );
  }
  if (command == "~addperm") {
    if (!part.user.permissions.hasPermission("command.addperm")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0] || !args[1]) {
      ch.dmAsServer(part, "This command adds permissions to a user!");
      ch.dmAsServer(part, "Usage: ~addperm " + part._id + " quota.bypass.note");
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    if (!user.permissions.isValidPermission(args[1])) {
      ch.dmAsServer(
        part,
        "Invalid permission. View the readme to get a list of permissions.",
      );
      return;
    }

    user.permissions.addPermission(args[1]);

    ch.dmAsServer(
      part,
      "Adder user's `" + user.name + "` permission: `" + args[1] + "`!",
    );
  }

  if (command == "~delperm") {
    if (!part.user.permissions.hasPermission("command.delperm")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0] || !args[1]) {
      ch.dmAsServer(part, "This command removes a permission from a user!");
      ch.dmAsServer(part, "Usage: ~delperm " + part._id + " quota.bypass.note");
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    user.permissions.deletePermission(args[1]);

    ch.dmAsServer(
      part,
      "Removed user's `" + user.name + "` permission: `" + args[1] + "`!",
    );
  }

  if (command == "~settag") {
    if (!part.user.permissions.hasPermission("command.settag")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0] || !args[1] || !args[2]) {
      let example = rankDefinitions["owner"].tag;

      ch.dmAsServer(part, "This command adds a tag to a user!");
      ch.dmAsServer(
        part,
        "Usage: ~settag " + part._id + " " + example.text + " " + example.color,
      );
      return;
    }

    if (!(args[1].length < 50 && args[1].length > 1)) {
      ch.dmAsServer(
        part,
        "Tag name has to be at least 1 character, maximum 50 characters.",
      );
      return;
    }

    if (!verifyColor(args[2])) {
      ch.dmAsServer(
        part,
        "Invalid color. Run the command without any arguments to see the value.",
      );
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    user.permissions.setTag(args[1].replaceAll("_", " "), args[2]);

    ch.dmAsServer(
      part,
      "Set " + user.name + " tag to `" + args[1] + "` (`" + args[2] + "`)!",
    );
  }

  if (command == "~deltag") {
    if (!part.user.permissions.hasPermission("command.deltag")) {
      ch.dmAsServer(part, "No permissions.");
      return;
    }
    if (!args[0]) {
      ch.dmAsServer(part, "This command removes a user's tag!");
      return;
    }

    let channelUserIsIn = [...Server.channels].find((z) =>
      z[1].participants.has(args[0])
    )?.[1];
    let user = channelUserIsIn?.participants?.get(args[0])?.user;

    if (!user) {
      let tempUser = User.userExists(args[0]);
      if (tempUser.length != 0) {
        user = new User(tempUser[0]._id);
      }
    }

    if (!user) {
      ch.dmAsServer(part, "User does not exist.");
      return;
    }

    user.permissions.deleteTag();

    ch.dmAsServer(part, "Removed user's `" + user.name + "` tag.");
  }

  command = null;
  args = null;
  message = null;
}
