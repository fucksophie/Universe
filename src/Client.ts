import Channel from "./Channel";
import Hashing from "./Hashing";
import Quota from "./Quotas";
import Server, { UniverseWS } from "./Server";
import User from "./User";

type QuotaObject = Record<"channelChange" | "userset", Quota>;

export default class Client {
  ws: UniverseWS;
  private ip: string;
  _id: string;
  private buffer: any[] = []; // thanks Lapis for the idea!
  private bufferTick: Timer;
  channel: Channel;
  quotas: QuotaObject = {} as QuotaObject;

  initQuotas() { // TODO: afaik the only drawback from making new users here is the fact that they won't update automatically
    this.quotas = {
      channelChange: new Quota(new User(this._id), "channelChange", [{
        allowance: 1,
        max: 10,
        interval: 2e3,
      }]),
      userset: new Quota(new User(this._id), "userset", [{
        allowance: 1,
        max: 30,
        interval: 18e5,
      }]),
    };
  }

  updateQuotaFlags(n: number) {
    Object.values(this.quotas).forEach((z) => {
      z.updateFlags(n);
    });
  }

  constructor(ws: UniverseWS, ip: string) {
    this.ws = ws;
    this.ip = ip;
    this._id = Hashing.idHashing(this.ip);
    this.bufferTick = setInterval(() => {
      if (this.buffer.length != 0) {
        this.ws.send(JSON.stringify(this.buffer));
        this.buffer = [];
      }
    }, 50);
  }

  notify(
    title = "",
    text = "",
    html = "",
    id = "",
    target = "#piano",
    cls = "classic",
    duration = 30000,
  ) {
    if (!id) id = Math.floor(Math.random() * 999999999).toString();
    this.sendArray({
      m: "notification",
      title,
      text,
      html,
      id,
      target,
      class: cls,
      duration,
    });
  }

  destroy() {
    clearInterval(this.bufferTick as unknown as number);
    Object.values(this.quotas).map((z) => z.destroy());
    Server.listeners.delete(this);
    Server.customListeners.delete(this);

    if (this.ws.readyState == 1) this.ws.close(3000, "client destroyed");

    this.ws = null;
    this.ip = null;
    this._id = null;
    this.bufferTick = null;
    this.buffer = null;
    this.quotas = null;
  }

  sendArray(a: any) {
    if (!this.ws) return;
    this.buffer.push(a);
  }
}
