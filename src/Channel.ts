import Client from "./Client";
import { Logger } from "./Logger";
import Participiant from "./Participiant";
import Server from "./Server";
import User from "./User";

function formatTime(t: number): string {
  let year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number;

  second = Math.floor(t / 1000);
  minute = Math.floor(second / 60);
  second = second % 60;
  hour = Math.floor(minute / 60);
  minute = minute % 60;
  day = Math.floor(hour / 24);
  hour = hour % 24;
  month = Math.floor(day / 30);
  day = day % 30;
  year = Math.floor(month / 12);
  month = month % 12;

  let timeS = "";
  timeS += `${year ? year + " years, " : ""}${month ? month + " months, " : ""}${day ? day + " days, " : ""}`
  timeS += `${hour} hours, ${minute} minutes, ${second} seconds`

  return timeS;
}

interface ChannelSettings {
  chat?: boolean;
  color?: string;
  color2?: string;
  visible?: boolean;
  limit?: number;
  crownsolo?: boolean;
  "no cussing"?: boolean;
  minOnlineTime?: number;
  lobby: boolean;
}

interface Crown {
  endPos: {
    x: number;
    y: number;
  };
  startPos: {
    x: number;
    y: number;
  };
  userId?: string;
  time: number;
  participantId?: string;
}

export interface ChannelConfiguration {
  settings: ChannelSettings;
  crown?: Crown;
}

export function getDefaultConfig(): ChannelConfiguration {
  return {
    settings: {
      "chat": true,
      "color": "#440c09",
      "visible": true,
      "limit": 50,
      "crownsolo": false,
      "no cussing": false,
      "minOnlineTime": 3600000,
      "color2": "#000000",
      "lobby": false,
    },
    crown: undefined,
  };
}

interface Kickban {
  duration: number;
  creation: number;
}

let pings = new Map<string, number>();

setInterval(() => { // Channel watchdog, interval*3 == time byebye
  Server.channels.forEach((z) => {
    if (!z.participants) return;

    if (!pings.has(z._id)) pings.set(z._id, 0);

    if (z.participants.size == 0) {
      pings.set(z._id, pings.get(z._id) + 1);
      if (pings.get(z._id) >= 3) {
        pings.delete(z._id);
        z.destroy();
      }
    } else {
      pings.set(z._id, 0)
    }
  });
}, 10000);

interface Chat {
  m: string;
  t: number;
  a: string;
  p?: { _id: string; id: string; name: string; color: string; tag: {} };
  recipient?: {
    _id: string;
    id: string;
    name: string;
    color: string;
    tag: {};
  };
  sender?: { _id: string; id: string; name: string; color: string; tag: {} };
};

export default class Channel {
  participants = new Map<string, Participiant>();
  config: ChannelConfiguration;
  logger: Logger;

  _id: string;

  chatHistory: Chat[] = [];

  crownOnGround: boolean;
  kickbans = new Map<string, Kickban>()
  constructor(_id: string, config: ChannelConfiguration | undefined) {
    this._id = _id;

    this.logger = new Logger("Channel (" + this._id + ")");
    this.logger.success("Created!");
    this.config = config;

    if (!this.config) this.config = getDefaultConfig();
    this.config.settings.lobby = Channel.isLobby(this._id);
    this.crownOnGround = false;
  }

  addToChatHistory(c: Chat) {
    this.chatHistory.push(c);
    if(this.chatHistory.length > 50) this.chatHistory.shift()
  }

  kickban(part: Participiant, bannedBy: Participiant, ms: number) {
    if(part.user.permissions.hasPermission("rooms.antiKickban")) {
      bannedBy.clients.forEach(z => {
        z.notify("Error.", "You can't ban this user.")
      })
      return;
    }
    const ch = Server.getChannel("test/awkward");

    this.kickbans.set(part._id, {
      duration: ms,
      creation: Date.now()
    })

    let id = part._id; // #1

    ch.message(bannedBy, "Banned " + part.user.name + " for " + ms + "ms. ")

    part.clients.forEach(z => {
      ch.addClient(z); // EXPLANATION: this drops the particpiant so we copy the id ->> #1
      this.removeClient(z);
      z.notify("Aww.", "You've been kickbanned from this room. Time left: " + formatTime(ms));
    })

    setTimeout(()=> {
      this.kickbans.delete(id);
    }, ms)
  }
  addClient(c: Client) {
    c.channel = this;

    if (
      this.participants.size >= this.config.settings.limit &&
      this._id != "test/awkward"
      && c.getID() !== this.config.crown?.userId
      && !new User(c.getID()).permissions.hasPermission("rooms.bypassLimit")
    ) {
      const ch = Server.getChannel("test/awkward");
      ch.addClient(c);
      c.notify("Oops!", "This room is currently full.");
      return;
    }

    if(this.kickbans.has(c.getID()) && this._id != "test/awkawrd") {
      let ban = this.kickbans.get(c.getID());
      let time = ban.creation-(Date.now()-ban.duration);

      if(time <= 0) {
        this.kickbans.delete(c.getID());
      } else {
        const ch = Server.getChannel("test/awkward");
        ch.addClient(c);
        c.notify("Aww.", "You've been kickbanned from this room. Time left: " + formatTime(time));
        return;
      }
    }

    let part = this.participants.get(c.getID());

    if (part) {
      part.clients.push(c);

      part.channel = this._id;
    } else {
      part = new Participiant(c.getID(), this._id);
      part.channel = this._id;
      part.clients.push(c);
      this.participants.set(c.getID(), part);
      this.broadcastToChannel(part.toJson(), c.getID());
    }
    if (
      this.participants.size == 1 &&
        !Channel.isLobby(this._id) || this.config.crown?.userId == c.getID()
    ) { // user just joined this room or the crown owner is the user, and it's not a lobby, add to user
      part.updateQuotaFlags(2);

      this.chown(part.pID);
    } else {
      if (Channel.isLobby(this._id)) { // is a lobby. set quotaflags to 1 (lobby)
        part.updateQuotaFlags(1);
      } else { // not a lobby, also doesn't own the crown. set quotaflags to 0
        part.updateQuotaFlags(0);
      }
    }

    c.sendArray({ m: "nq", ...part.quotas.note.getRaw() });

    this.sendChatHistory(c);

    c.sendArray({
      m: "ch",
      ...this.toJson(part),
      p: part.pID,
    });

    this.updateListeners();
  }

  destroy() {
    const ch = Server.getChannel("test/awkward");

    this.participants.forEach((z) => {
      z.clients.forEach((b) => {
        ch.addClient(b);
        b.notify("Oops!", "Room is being destroyed.");
        return;
      });
    });

    Server.channels.delete(this._id);

    this.participants = null;
    this.config = null;
    this.logger = null;
    this._id = null;
    this.chatHistory = null;
  }

  updateChannel() {
    this.participants.forEach((z) => {
      z.clients.forEach((b) =>
        b.sendArray({
          m: "ch",
          ...this.toJson(z),
          p: z.pID,
        })
      );
    });

    this.updateListeners();
  }

  updateListeners() {
    Server.listeners.forEach((z) => {
      z.sendArray({
        m: "ls",
        c: false,
        u: [this.toJson(z.channel.getPart(z)).ch],
      });
    });
  }
  broadcastToChannel(message: any, exempt = "") {
    this.participants.forEach((z) => {
      if (exempt) {
        if (z._id == exempt) return;
      }

      z.clients.forEach((b) => b.sendArray(message));
    });
  }
  chown(id: string | undefined = undefined) {
    if (id) {
      let part = [...this.participants.values()].find((z) => z.pID == id);
      this.config.crown = {
        participantId: part.pID,
        userId: part._id,
        time: Date.now(),
        startPos: {
          x: 50,
          y: 50,
        },
        endPos: {
          x: 50,
          y: 20,
        },
      };
      this.crownOnGround = false;
    } else {
      this.config.crown = {
        userId: this.config.crown.userId,
        time: Date.now(),
        startPos: {
          x: 50,
          y: 50,
        },
        endPos: {
          x: 50,
          y: 20,
        },
      };
      this.crownOnGround = true;
    }

    this.updateChannel();
  }
  moveMouse(p: Participiant, x: number, y: number) {
    p.x = x;
    p.y = y;

    this.broadcastToChannel({
      m: "m",
      x,
      y,
      id: p.pID,
    }, p._id);
  }

  sendChatHistory(c: Client) {
    let iCanSeeDms = c.channel.getPart(c).user.permissions.hasPermission(
      "rooms.seeDms",
    );
    let personalizedChatHistory = [];

    for (const m of this.chatHistory) {
      if (m.m == "a") {
        personalizedChatHistory.push(m);
      } else {
        if (
          m.recipient._id == c.getID() || m.sender._id == c.getID() ||
          iCanSeeDms
        ) {
          personalizedChatHistory.push(m);
        }
      }
    }

    c.sendArray({
      m: "c",
      c: personalizedChatHistory,
    });
  }

  message(part: Participiant, message: string) {
    let packet = {
      m: "a",
      t: Date.now(),
      a: message,
      p: {
        _id: part._id,
        id: part.pID,
        name: part.user.name,
        color: "#" + part.user.color,
        tag: part.user.permissions.getTag(),
      },
    };

    this.addToChatHistory(packet);

    this.broadcastToChannel(packet);
  }

  dm(sender: Participiant, recipient: Participiant, message: string) {
    let packet = {
      m: "dm",
      t: Date.now(),
      a: message,
      sender: {
        _id: sender.user._id,
        name: sender.user.name,
        color: "#" + sender.user.color,
        tag: sender.user.permissions.getTag(),
        id: sender.pID,
      },
      recipient: {
        _id: recipient.user._id,
        name: recipient.user.name,
        color: "#" + recipient.user.color,
        tag: recipient.user.permissions.getTag(),
        id: recipient.pID,
      },
    };

    this.chatHistory.push(packet);

    sender.clients.forEach((z) => z.sendArray(packet));
    recipient.clients.forEach((z) => z.sendArray(packet));
    this.participants.forEach((z) => {
      if (
        z.user.permissions.hasPermission("rooms.seeDms") &&
        sender._id != z._id && recipient._id != z._id
      ) {
        z.clients.forEach((b) => b.sendArray(packet));
      }
    });
  }

  messageAsServer(message: string) {
    let packet = {
      m: "a",
      t: Date.now(),
      a: message,
      p: {
        _id: "server",
        id: "server",
        name: "Server",
        color: "#0066ff",
        tag: {
          text: "the server",
          color: "#42698c",
        },
      },
    };

    this.addToChatHistory(packet);

    this.broadcastToChannel(packet);
  }

  dmAsServer(recipient: Participiant, message: string) {
    let packet = {
      m: "dm",
      t: Date.now(),
      a: message,
      recipient: {
        _id: recipient.user._id,
        name: recipient.user.name,
        color: "#" + recipient.user.color,
        tag: recipient.user.permissions.getTag(),
        id: recipient.pID,
      },
      sender: {
        _id: "server",
        id: "server",
        name: "Server",
        color: "#0066ff",
        tag: {
          text: "the server",
          color: "#42698c",
        },
      },
    };

    this.chatHistory.push(packet);

    recipient.clients.forEach((z) => z.sendArray(packet));
  }
  toJson(p: Participiant) {
    return {
      ch: {
        settings: {
          lobby: this.config.settings.lobby,
          chat: this.config.settings.chat,
          color: this.config.settings.color,
          visible: this.config.settings.visible,
          limit: this.config.settings.limit,
          minOnlineTime: this.config.settings.minOnlineTime,
          crownsolo: this.config.settings.crownsolo,
          "no cussing": this.config.settings["no cussing"],
          color2: this.config.settings.color2,
        },
        _id: this._id,
        id: this._id,
        count: this.participants.size,
        crown: this.config.crown,
        banned: p ? this.kickbans.has(p._id) : false
      },
      ppl: [...this.participants.values()].map((z) => {
        return {
          _id: z.user._id,
          id: z.pID,
          name: z.user.name,
          color: "#" + z.user.color,
          tag: z.user.permissions.getTag(),
          x: z.x,
          y: z.y,
        };
      }),
    };
  }

  removeClient(c: Client) {
    let part = this.participants.get(c.getID());
    if (!part) return;

    part.clients = part.clients.filter((z) => z.ws !== c.ws);

    if (part.clients.length == 0) {
      this.broadcastToChannel({
        m: "bye",
        p: part.pID,
      });

      part.destroy();
      this.participants.delete(c.getID());

      if (this.config.crown) {
        if (
          this.config.crown.participantId == part.pID && !this.crownOnGround
        ) {
          this.chown();
        }
      }
    }

    this.updateListeners();
  }

  getPart(c: Client): Participiant | undefined {
    return this.participants.get(c.getID());
  }

  static isLobby(_id) {
    if (_id == "test/") return true;
    if (_id == "lobby") return true;

    if (/^lobby\d{1,3}$/.test(_id)) return true;
    if (_id.startsWith("test/")) return true;

    return false;
  }
}
