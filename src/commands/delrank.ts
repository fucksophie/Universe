import Channel from "../Channel";
import Participiant from "../Participiant";
import { rankDefinitions } from "../Permissions";
import Server from "../Server";
import User from "../User";

export default {
  defaultPermission: true,
  name: "delrank",
  usage: "someID owner",
  description: "This command removes a rank from a user!",
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

    if (!rankDefinitions[args[1]]) {
      channel.dmAsServer(
        part,
        `Rank does not exist. Available ranks: ${
          Object.keys(rankDefinitions).join(", ")
        }`,
      );
      return;
    }

    user.ranks.delete(args[1]);
    user.commit();

    channel.dmAsServer(
      part,
      "Removed user's `" + user.name + "` rank: `" + args[1] + "`!",
    );
  },
};
