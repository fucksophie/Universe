import Channel from "../Channel";
import Participiant from "../Participiant";
import Server, { verifyColor } from "../Server";
import User from "../User";

export default {
  defaultPermission: true,
  name: "settag",
  usage: "someID tag_text #002200",
  description: "Set a user's tag!",
  eval(args: string[], channel: Channel, part: Participiant) {
    if (!(args[1].length < 50 && args[1].length > 1)) {
      channel.dmAsServer(
        part,
        "Tag name has to be at least 1 character, maximum 50 characters.",
      );
      return;
    }

    if (!verifyColor(args[2])) {
      channel.dmAsServer(
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
      channel.dmAsServer(part, "User does not exist.");
      return;
    }

    user.permissions.setTag(args[1].replaceAll("_", " "), args[2]);

    channel.dmAsServer(
      part,
      "Set " + user.name + " tag to `" + args[1] + "` (`" + args[2] + "`)!",
    );
  },
};
