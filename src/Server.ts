/*
  code sponsored by
   https://141.lv
  and https://lu.lv

         _____
     _  |___ /
    (_)   |_ \
     _   ___) |
    (_) |____/
*/

// TODO: Implement global chat logging/flushing

import { Logger } from "./Logger";
import Channel, { ChannelConfiguration, getDefaultConfig } from "./Channel";
import Client from "./Client";
import User from "./User";
import { gc, ServerWebSocket } from "bun";
import { Antibot } from "./Antibot";
import { heapStats, memoryUsage } from "bun:jsc";

let noteKeys = [
  "a-1",
  "as-1",
  "b-1",
  "c0",
  "cs0",
  "d0",
  "ds0",
  "e0",
  "f0",
  "fs0",
  "g0",
  "gs0",
  "a0",
  "as0",
  "b0",
  "c1",
  "cs1",
  "d1",
  "ds1",
  "e1",
  "f1",
  "fs1",
  "g1",
  "gs1",
  "a1",
  "as1",
  "b1",
  "c2",
  "cs2",
  "d2",
  "ds2",
  "e2",
  "f2",
  "fs2",
  "g2",
  "gs2",
  "a2",
  "as2",
  "b2",
  "c3",
  "cs3",
  "d3",
  "ds3",
  "e3",
  "f3",
  "fs3",
  "g3",
  "gs3",
  "a3",
  "as3",
  "b3",
  "c4",
  "cs4",
  "d4",
  "ds4",
  "e4",
  "f4",
  "fs4",
  "g4",
  "gs4",
  "a4",
  "as4",
  "b4",
  "c5",
  "cs5",
  "d5",
  "ds5",
  "e5",
  "f5",
  "fs5",
  "g5",
  "gs5",
  "a5",
  "as5",
  "b5",
  "c6",
  "cs6",
  "d6",
  "ds6",
  "e6",
  "f6",
  "fs6",
  "g6",
  "gs6",
  "a6",
  "as6",
  "b6",
  "c7",
];

export interface UniverseWS extends ServerWebSocket {
  client: Client;
  hiSent: boolean;
  antibot: Antibot;
  sentDevices: boolean;
}

export function verifyColor(color = ""): boolean {
  if (!color) return false;
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/gm.test(color);
}

function verifyNumber(number = ""): boolean {
  if (!number) return false;
  if (isNaN(+number)) return;
  return true;
}

function validateSet(
  data: any,
  initial: ChannelConfiguration | undefined = undefined,
): ChannelConfiguration {
  let set: ChannelConfiguration;

  if (initial) {
    set = initial;
  } else {
    set = getDefaultConfig();
  }

  if (data) {
    if (typeof set.settings.chat == "boolean") {
      set.settings.chat = Boolean(data.chat);
    }
    if (verifyColor(data.color)) set.settings.color = data.color;
    if (typeof set.settings.visible == "boolean") {
      set.settings.visible = Boolean(data.visible);
    }
    if (verifyNumber(data.limit)) set.settings.limit = +data.limit;
    if (typeof set.settings["no cussing"] == "boolean") {
      set.settings["no cussing"] = Boolean(data["no cussing"]);
    }
    if (verifyNumber(data.minOnlineTime)) {
      set.settings.minOnlineTime = +data.minOnlineTime;
    }
    if (verifyColor(data.color2)) set.settings.color2 = data.color2;
  }

  return set;
}

import parseCommand from "./Commands";

export default class Server {
  static logger = new Logger("Server");

  static clients: Client[] = [];
  static channels = new Map<string, Channel>();
  static users = new Map<string, User>();

  static listeners = new Set<Client>();
  static customListeners = new Set<Client>();
  static messageCount = 0;

  constructor() {
    setInterval(async () => { // TODO: shitty workaround for a memoryleak somewhere idk (or maybe shitty bun gc?? ja neznaju)
      let gcStart = heapStats().objectCount;
      Bun.gc(true);
      let gcEnd = heapStats().objectCount;

      Server.logger.info([
        "GC. Freed:",
        gcStart - gcEnd,
        "objects. Current object count:",
        gcEnd,
        "Message count:", Server.messageCount
      ]);
      Server.messageCount = 0;
      gcEnd = null;
      gcStart = null;
    }, 15000);
  }

  static getChannel(
    name: string,
    config: ChannelConfiguration | undefined = undefined,
  ): Channel {
    if (Server.channels.has(name)) {
      return Server.channels.get(name)!;
    } else {
      const ch = new Channel(name, config);
      Server.channels.set(name, ch);
      return ch;
    }
  }

  static async requestHandler(ws: UniverseWS, raw: string | Uint8Array) {
    if (raw instanceof Uint8Array) return;

    let hh;
    try {
      hh = JSON.parse(raw);
    } catch {
      return;
    }

    if (!Array.isArray(hh)) return;

    hh.forEach((data) => {
      if (ws.antibot.verifyMessage(ws, data)) {
        ws.client.notify(
          "Antibot!",
          "The antibot isn't that hard to bypass. Please try harder.",
        );
        setTimeout(() => {
          ws.close();
        }, 120);
        return;
      }
      Server.messageCount++;
      if (data.m == "hi") {
        if (ws.hiSent) return;
        ws.hiSent = true;

        if (data.token) {
          let dd = User.getToken(data.token);
          if (dd.length != 0) ws.client._id = dd[0]._id;
        }

        // EXPLANATION:
        // This code attempts to find a user with the same _ID as our logging in user
        // if found, merges both quotas together
        // so both users do the same thing.
        // If 20 users join, first user will get it's quotas set,
        // then the second one joining in will get the first ones quotas,
        // then the third one will get the second one's quotas (still the first ones!)

        let sameIDUser = Server.clients.find((z) =>
          z._id == ws.client._id && z.ws != ws
        );

        if (sameIDUser) {
          ws.client.quotas = sameIDUser.quotas;
        } else {
          ws.client.initQuotas();
        }

        let user = new User(ws.client._id);

        ws.client.sendArray({
          m: "hi",
          token: user.token,
          permissions: user.permissions.mppcPermissions(),
          t: Date.now(),
          u: {
            _id: user._id,
            name: user.name,
            color: user.color,
            tag: user.permissions.getTag(),
          },
        });
      }

      if (data.m == "v") {
        if (!ws.client) return;

        let ch = ws.client.channel;
        if (!ch) return;
        let part = ch.participants.get(ws.client._id);
        if (!part) return;

        if (typeof data.vanish != "boolean") return;

        if (!part.user.vanished && data.vanish) {
          ch.broadcastToChannel({
            m: "bye",
            p: part.pID,
          }, ws.client._id);
        }

        part.user.vanished = data.vanish;
        part.user.emit("update"); // manual update which doesn't actually update the DB
      }
      if (data.m == "ch") {
        if (!ws.client) return;

        if (!data._id) return;
        if (typeof data._id !== "string") return;
        if (data._id.length > 50) return;

        let set = validateSet(data.set);

        if (!ws.client.quotas.channelChange.isAvailable()) return;

        const prevCh = ws.client.channel;

        if (prevCh) prevCh.removeClient(ws.client);

        const ch = Server.getChannel(data._id, set);

        ch.addClient(ws.client);
      }

      if (data.m == "chset") {
        let ch = ws.client.channel;
        if (!ch) return;

        if (
          !ch.participants.get(ws.client._id).user.permissions.hasPermission(
            "rooms.chsetAnywhere",
          )
        ) {
          if (!ch.config.crown) return;
          if (
            ch.config.crown.userId !== ws.client._id || ch.crownOnGround
          ) {
            return;
          }
        }

        let cfg = validateSet(data.set, ch.config);
        ch.config = cfg;
        ch.updateChannel();
      }

      if (data.m == "chown") {
        if (!ws.client) return;

        let ch = ws.client.channel;
        if (!ch) return;
        let part = ch.participants.get(ws.client._id);
        if (!part) return;

        if (part.user.permissions.hasPermission("rooms.chownAnywhere")) {
          ch.chown(data.id);
          return;
        }

        if (!part.quotas.chown.isAvailable()) return;

        // EXPLANATION: check if crown if 15 seconds have lasted after last crown update,
        // if have, we check if we aren't the previous owner, and then pick up the crown if
        // available
        if (
          ch.config.crown.userId !== ws.client._id &&
          (Date.now() - ch.config.crown.time) > 15000
        ) {
          ws.client.updateQuotaFlags(2);
          ch.chown(part.pID);
          ws.client.sendArray({ m: "nq", ...part.quotas.note.getRaw() });
          return;
        }

        // EXPLANATION: if we dropped a crown, we can pick it back up with this
        if (
          ch.config.crown.userId == ws.client._id && data.id == part.pID &&
          ch.crownOnGround
        ) {
          ws.client.updateQuotaFlags(2);
          ch.chown(data.id);
          ws.client.sendArray({ m: "nq", ...part.quotas.note.getRaw() });
          return;
        }

        if (data.id) {
          // EXPLANATION: check if id is not us, then check if we own the crown, and if it's on the ground
          // if so, we give the crown to the person we specified

          if (
            data.id !== ws.client._id &&
            ch.config.crown.userId == ws.client._id && !ch.crownOnGround
          ) {
            ws.client.updateQuotaFlags(0);
            ch.chown(data.id);
            ws.client.sendArray({ m: "nq", ...part.quotas.note.getRaw() });
          }
        } else {
          // EXPLANATION: ID was not specified, meaning dropping of crown,
          // however we have to check if the crown isn't on the ground, and
          // if we actually own the crown.

          if (
            ch.config.crown.userId == ws.client._id && !ch.crownOnGround
          ) {
            ws.client.updateQuotaFlags(0);
            ch.chown();
            ws.client.sendArray({ m: "nq", ...part.quotas.note.getRaw() });
          }
        }
      }

      if (data.m == "bye") {
        ws.close();
      }

      if (data.m == "m") {
        if (!verifyNumber(data?.x) || !verifyNumber(data?.y)) return;

        if (ws.client.channel) {
          let part = ws.client.channel.participants.get(ws.client._id);
          if (!part) return;

          if (!part.quotas.mouseMove.isAvailable()) return;
          ws.client.channel.moveMouse(part, +data.x, +data.y);
          data.y = null;
          data.x = null;
        }
      }

      if (data.m == "setname") {
        if (!data._id) return;
        if (!data.name) return;

        const ch = ws.client.channel;
        const part = ch.participants.get(ws.client._id);
        if (!part.user.permissions.hasPermission("rooms.usersetOthers")) return;
        let otherUser = ch.participants.get(data._id);
        if (!otherUser) return;
        if (data.name.length > 250) return;
        if (data.name.trim().length == 0) return;
        otherUser.user.name = data.name;
        otherUser.user.commit();
      }

      if (data.m == "setcolor") {
        if (!data._id) return;
        if (!data.color) return;

        const ch = ws.client.channel;
        const part = ch.participants.get(ws.client._id);
        if (!part.user.permissions.hasPermission("rooms.usersetOthers")) return;
        let otherUser = ch.participants.get(data._id);
        if (!otherUser) return;
        if (!verifyColor(data.color)) return;
        otherUser.user.color = data.color.substring(1);
        otherUser.user.commit();
      }

      if (data.m == "kickban") {
        if (!data._id) return;

        const ch = ws.client.channel;
        const part = ch.participants.get(ws.client._id);

        if (!part.user.permissions.hasPermission("rooms.chownAnywhere")) {
          if (ch.crownOnGround) return;
          if (!ch.config.crown) return;
          if (ch.config.crown.userId !== part._id) return;
        }

        let otherUser = ch.participants.get(data._id);
        if (!otherUser) return;

        let ms = 3600000;

        if (data.ms) {
          if (verifyNumber(data.ms)) ms = data.ms;
        }

        if (!part.user.permissions.hasPermission("rooms.chownAnywhere")) {
          if (!part.quotas.kickban.isAvailable()) return;
        }

        ch.kickban(otherUser, part, ms);
      }

      if (data.m == "clearchat") {
        const ch = ws.client.channel;
        const part = ch.participants.get(ws.client._id);
        if (!part.user.permissions.hasPermission("rooms.clearChat")) return;

        ch.chatHistory = [];
        ch.broadcastToChannel({
          m: "c",
          c: [],
        });
      }

      if (data.m == "dm") {
        const ch = ws.client.channel;
        if (!ch) return;
        if (!data.message) return;
        if (!data._id) return;
        if (typeof data.message !== "string") return;
        if (data.message.length > 512) return;

        let otherUser = ch.participants.get(data._id);
        if (!otherUser) return;
        let part = ch.participants.get(ws.client._id);
        if (!part.quotas.dm.isAvailable()) return;

        ch.dm(part, otherUser, data.message);
      }

      if (data.m == "a") {
        const ch = ws.client.channel;
        if (!ch) return;
        if (!data.message) return;
        if (typeof data.message !== "string") return;
        if (data.message.length > 512) return;

        let part = ch.participants.get(ws.client._id);
        if (!part.quotas.chat.isAvailable()) return;

        ch.message(part, data.message);

        parseCommand(ws, data.message);
      }

      if (data.m == "n") {
        const ch = ws.client.channel;

        if (!ch) return;

        if (
          ch.config.settings.crownsolo &&
          ch.config.crown?.userId !== ws.client._id
        ) return;

        if (!Array.isArray(data.n)) return;

        // EXPLANATION: per MPPclone rules we check if
        // delay is smaller than 200
        // z.v is 1 or 0 inclusive
        // z.s is 0, false, undefined or 1
        // z.n is one of the MPP keys

        let isBad = data.n.find((z) => {
          if (z.d > 200) return true;
          if (z.v > 1 || z.v < 0) return true;
          if (!(!z.s || z.s == 1)) return true;
          if (!noteKeys.includes(z.n)) return true;
          return false;
        });

        if (isBad) return;

        let part = ch.participants.get(ws.client._id);

        if (!part) return;
        if (!part.quotas.note.isAvailable(data.n.length)) return;

        ch.broadcastToChannel({
          m: "n",
          t: data.t,
          n: data.n,
          p: part.pID,
        }, ws.client._id);
      }

      if (data.m == "t") {
        if (!verifyNumber(data.e)) return;

        ws.client.sendArray({
          m: "t",
          t: Date.now(),
          e: data.e,
        });
      }

      if (data.m == "+ls") {
        const ch = ws.client.channel;

        if (!ch) return;

        let part = ch.participants.get(ws.client._id);

        if (!part) return;

        if (!Server.listeners.has(ws.client)) {
          Server.listeners.add(ws.client);
          let json = [...Server.channels.values()].map((z) =>
            z.toJson(ws.client.channel.participants.get(ws.client._id)).ch
          );

          if (!part.user.permissions.hasPermission("rooms.seeInvisibleRooms")) {
            json = json.filter((z) =>
              z.settings.visible != false || z._id == ch._id
            );
          }

          ws.client.sendArray({
            m: "ls",
            c: true,
            u: json,
          });
        }
      }

      if (data.m == "custom") {
        const ch = ws.client.channel;
        if (!ch) return;

        if (!data.target) return;
        if (!data.data) return;
        if (typeof data.target !== "object") return;
        if (!data.target.mode) return;
        let global;
        Boolean;
        if (!data.target.global) global = false;
        else global = true;

        let part = ch.participants.get(ws.client._id);

        let param = {
          "m": "custom",
          "data": data.data,
          p: part.pID,
        };

        if (data.target.mode == "subscribed") {
          for (let cc of Array.from(Server.customListeners.values())) {
            if (!cc.channel) return;

            if (!global) {
              if (cc.channel._id !== ws.client.channel._id) {
                return;
              }
            }
            cc.sendArray(param);
          }
        } else if (data.target.mode == "id") {
          if (!data.target.id) return;
          if (typeof data.target.id !== "string") return;
          if (!global) {
            let part = ch.participants.get(data.target.id);

            if (!part) {
              part = [...ch.participants].find((z) =>
                z[1].pID == data.target.id
              )?.[1];
            }
            if (!part) return;
            part.clients.forEach((z) => z.sendArray(param));
          } else {
            Server.channels.forEach((z) => {
              let part = z.participants.get(data.target.id);

              if (!part) {
                part = [...z.participants].find((z) =>
                  z[1].pID == data.target.id
                )?.[1];
              }
              if (!part) return;

              part.clients.forEach((z) => z.sendArray(param));
            });
          }
        } else if (data.target.mode == "ids") {
          if (!data.target.ids) return;
          if (!Array.isArray(data.target.ids)) return;
          if (data.target.ids.length > 32) return;
          if (!data.target.ids.every((i) => typeof i === "string")) return;
          if (!global) {
            data.target.ids.forEach((id) => {
              if (!id) return;
              let part = ch.participants.get(id);

              if (!part) {
                part = [...ch.participants].find((z) => z[1].pID == id)?.[1];
              }
              if (!part) return;
              part.clients.forEach((z) => z.sendArray(param));
            });
          } else {
            data.target.ids.forEach((id) => {
              if (!id) return;
              Server.channels.forEach((z) => {
                let part = z.participants.get(id);

                if (!part) {
                  part = [...z.participants].find((z) => z[1].pID == id)?.[1];
                }
                if (!part) return;

                part.clients.forEach((z) => z.sendArray(param));
              });
            });
          }
        }
      }
      if (data.m == "-ls") {
        Server.listeners.delete(ws.client);
      }
      if (data.m == "-custom") {
        Server.customListeners.delete(ws.client);
      }

      if (data.m == "+custom") {
        if (!Server.customListeners.has(ws.client)) {
          Server.customListeners.add(ws.client);
        }
      }

      if (data.m == "userset") {
        if (!ws.client) return;

        if (!data.set) {
          return;
        }

        if (!data.set.name && !data.set.color) return;

        if (!ws.client.channel) return;

        let part = ws.client.channel.participants.get(ws.client._id);

        let user = part.user;

        if (data.set.name) {
          if (typeof data.set.name !== "string") return;
          if (data.set.name.length > 50) return;
          user.name = data.set.name;
        }

        if (data.set.color) {
          if (!verifyColor(data.set.color)) return;
          user.color = data.set.color.substring(1);
        }

        if (!part.user.permissions.hasPermission("rooms.usersetOthers")) {
          if (!ws.client.quotas.userset.isAvailable()) return;
        }

        user.commit();
      }

      data = null;
    });
    hh = null;
  }

  async start() {
    Server.logger.info("Starting!");

    let server = Bun.serve({
      websocket: {
        message: async (ws: UniverseWS, message) => {
          await Server.requestHandler(ws, message);
          message = null;
        },
        maxPayloadLength: 16384,
        open(ws: UniverseWS) {
          let ip = "";

          if (ws.data) {
            ip = ws.data;
          } else {
            ip = ws.remoteAddress;
          }

          ws.client = new Client(ws, ip);
          ws.antibot = new Antibot();

          Server.clients.push(ws.client);
          Server.logger.info(`User ${ip}/${ws.client._id} connected.`);

          let code = ws.antibot.generateCode();
          if (Math.random() > .5) code = "~" + code;

          ws.client.sendArray({
            m: "b",
            code,
          });
        },
        close(ws: UniverseWS) {
          Server.clients = Server.clients.filter((z) => z.ws !== ws);
          const ch = ws?.client?.channel;

          if (ch) ch.removeClient(ws.client);
          if (ws.client) ws.client.destroy();

          ws = null;
        },
      },
      fetch(req, server) {
        if (
          !server.upgrade(req, {
            data: req.headers.get("X-Forwarded-For") || undefined,
          })
        ) {
          return new Response(null, { status: 404 });
        }
      },
      port: Bun.env.PORT || 8443,
    });

    Server.logger.success("Started on port " + server.port + "!");
  }
}
