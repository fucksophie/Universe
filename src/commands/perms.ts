import Channel from "../Channel";
import Participiant from "../Participiant";
import User from "../User";

export default {
  defaultPermission: true,
  name: "perms",
  usage: "someID",
  description:
    "This command lists the computed permissions of a user, including ranks.",
  eval(args: string[], channel: Channel, part: Participiant) {
    let user = User.userExists(args[0])?.[0];
    if (!user) {
      channel.dmAsServer(part, "User does not exist.");
      return;
    }

    const usr = new User(user._id);

    channel.dmAsServer(
      part,
      `${user.name} (${user._id})'s permissions: \`${
        [...usr.permissions.getPermissions()].join("\`, \`")
      }\``,
    );
  },
};
