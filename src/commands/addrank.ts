import Channel from "../Channel";
import Participiant from "../Participiant";
import { rankDefinitions } from "../Permissions";
import Server from "../Server";
import User from "../User";

export default {
  defaultPermission: true,
  name: "addrank",
  usage: "someID owner",
  description: "Add a rank to a user.",
  eval(args: string[], channel: Channel, part: Participiant) {
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

    user.ranks.add(args[1]);
    user.commit();

    channel.dmAsServer(
      part,
      "Granted user `" + user.name + "` rank: `" + args[1] + "`!",
    );
  },
};
