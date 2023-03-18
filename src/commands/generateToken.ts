import Channel from "../Channel";
import Hashing from "../Hashing";
import Participiant from "../Participiant";
import User from "../User";

export default {
  defaultPermission: true,
  name: "generateToken",
  usage: "",
  description: "Generate a token for a bot.",
  eval(args: string[], channel: Channel, part: Participiant) {
    const id = new User(Hashing.idHashing(crypto.randomUUID()));
    id.ranks.add("bot");
    id.commit();

    channel.dmAsServer(
      part,
      "Token for your bot: `" + id.token + "`, ID: `" + id._id + "`.",
    );
  },
};
