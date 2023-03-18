import Channel from "../Channel";
import Participiant from "../Participiant";

export default {
  defaultPermission: false,
  name: "id",
  usage: "",
  description: "See your own ID!",
  eval(args: string[], channel: Channel, part: Participiant) {
    channel.dmAsServer(
      part,
      "Your _id is \`" + part._id + "\`, pid is \`" + part.pID + "\`",
    );
  },
};
