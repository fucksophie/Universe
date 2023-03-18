import Channel from "../Channel";
import Participiant from "../Participiant";
import User from "../User";

export default {
  defaultPermission: true,
  name: "experms",
  usage: "someID",
  description:
    "This command lists the explicit permissions of a user, ones that aren't in a rank.",
  eval(args: string[], channel: Channel, part: Participiant) {
    let user = User.userExists(args[0])?.[0];
    if (!user) {
      channel.dmAsServer(part, "User does not exist.");
      return;
    }

    channel.dmAsServer(
      part,
      `${user.name} (${user._id})'s permissions: \`${
        JSON.parse(user.permissions).join("\`, \`")
      }\``,
    );
  },
};
