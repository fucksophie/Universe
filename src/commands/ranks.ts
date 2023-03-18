import Channel from "../Channel";
import Participiant from "../Participiant";
import User from "../User";

export default {
  defaultPermission: true,
  name: "ranks",
  usage: "someID",
  description: "This command lists all the ranks of a user.",
  eval(args: string[], channel: Channel, part: Participiant) {
    let user = User.userExists(args[0])?.[0];
    if (!user) {
      channel.dmAsServer(part, "User does not exist.");
      return;
    }

    channel.dmAsServer(
      part,
      `${user.name} (${user._id})'s ranks: \`${
        JSON.parse(user.ranks).join("\`, \`")
      }\``,
    );
  },
};
