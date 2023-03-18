import { generateHeapSnapshot } from "bun";
import Channel from "../Channel";
import Participiant from "../Participiant";

export default {
  defaultPermission: true,
  name: "heap",
  usage: "",
  description: "dump the heap (modonly and temporary)",
  eval(args: string[], channel: Channel, part: Participiant) {
    (async () => {
      const snapshot = generateHeapSnapshot();
      await Bun.write("heap" + Date.now() + ".json", JSON.stringify(snapshot));
      channel.messageAsServer("heap snapshot saved.");
    })();
  },
};
