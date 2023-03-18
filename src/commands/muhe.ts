import Channel from "../Channel";
import Participiant from "../Participiant";
import { UniverseWS } from "../Server";

export default {
  defaultPermission: false,
  name: "muhe",
  usage: "",
  description: "MUHE!!!!! SMOKI!!!!!",
  eval(args: string[], channel: Channel, part: Participiant) {
    channel.dmAsServer(part, "MUHE TIME!!!!");
  },
};
