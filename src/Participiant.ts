import Client from "./Client";
import Quota from "./Quotas";
import Server from "./Server";
import User from "./User";

export default class Participiant {
  pID: string;
  _id: string;
  clients: Client[] = [];
  channel: string;
  user: User;
  x = 0;
  y = 0;

  quotas: Record<string, Quota> = {};

  private updateListener: (...args: any[]) => void;

  toJson() {
    return {
      m: "p",
      _id: this._id,
      id: this.pID,
      name: this.user.name,
      color: "#" + this.user.color,
      tag: this.user.permissions.getTag(),
      x: this.x,
      y: this.y,
      vanished: this.user.vanished,
    };
  }

  constructor(_id: string, channel: string) {
    this.pID = (Math.floor(Math.random() * 999) + crypto.randomUUID())
      .replaceAll("-", "").substring(0, 16);
    this._id = _id;

    this.channel = channel;

    if (Server.users.has(this._id)) {
      this.user = Server.users.get(this._id);
    } else {
      let user = new User(this._id);
      Server.users.set(this._id, user);
      this.user = user;
    }

    this.updateListener = (() => {
      let ch = Server.getChannel(this.channel);

      let json = this.toJson();

      for (const [_, z] of ch.participants) {
        if (this.user.vanished && !z.user.permissions.hasPermission("vanish")) {
          continue;
        }

        z.clients.forEach((b) => b.sendArray(json));
      }

      Object.values(this.quotas).map((z) => z.emit("update"));
    }).bind(this);

    this.user.on("update", this.updateListener);

    this.initQuotas();
  }

  initQuotas() {
    this.quotas = {
      mouseMove: new Quota(this.user, "mouseMove", [{
        allowance: 15e3,
        max: 5e5,
        interval: 2e3,
      }]),
      chown: new Quota(this.user, "chown", [{
        allowance: 1,
        max: 10,
        interval: 5e3,
      }]),
      chat: new Quota(this.user, "chat", [
        { allowance: 4, max: 4, interval: 6e3 },
        { allowance: 4, max: 4, interval: 6e3 },
        { allowance: 10, max: 10, interval: 2e3 },
      ]),
      dm: new Quota(this.user, "dm", [
        { allowance: 5, max: 5, interval: 6e3 },
      ]),
      kickban: new Quota(this.user, "kickban", [{ // TODO: kickbanning is not implemented
        allowance: 1,
        max: 2,
        interval: 1000,
      }]),
      note: new Quota(this.user, "note", [
        { allowance: 400, max: 1200, interval: 2e3 },
        { allowance: 200, max: 600, interval: 2e3 },
        { allowance: 600, max: 1800, interval: 2e3 },
      ]),
    };
  }
  updateQuotaFlags(n: number) {
    Object.values(this.quotas).forEach((z) => {
      z.updateFlags(n);
    });
  }

  destroy() {
    this.user.removeListener("update", this.updateListener);
    Object.values(this.quotas).map((z) => z.destroy());
    if (!Server.clients.find((z) => z._id == this._id)) {
      Server.users.delete(this.user._id);
    }

    this.pID = null;
    this._id = null;
    this.clients = null;
    this.channel = null;
    this.user = null;
    this.x = null;
    this.y = null;
    this.updateListener = null;
    this.quotas = null;
  }
}
