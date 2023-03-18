import Channel from "../Channel";
import Participiant from "../Participiant";
import Server from "../Server";
import User from "../User";

export default {
  defaultPermission: true,
  name: "delperm",
  usage: "someID quota.bypass.note",
  description: "This command removes a permission from a user",
  eval(args: string[], channel: Channel, part: Participiant) {
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
      channel.dmAsServer(part, "User does not exist.");
      return;
    }

    user.permissions.deletePermission(args[1]);

    channel.dmAsServer(
      part,
      "Removed user's `" + user.name + "` permission: `" + args[1] + "`!",
    );
  },
};
