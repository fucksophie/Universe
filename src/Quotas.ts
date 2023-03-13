import * as EventEmitter from "events";
import User from "./User";

export default class Quota extends EventEmitter {
  values: { points: number; max: number; allowance: number }[] = [];
  name: string;
  selected: number;
  force: number;
  interval: Timer;
  points: number;
  user: User;
  bypassed: boolean;

  constructor(user: User, name: string, values = []) {
    super();

    this.values = values;

    this.name = name;
    this.force = 0;
    this.selected = 0;
    this.points = values[this.selected].max;
    this.user = user;

    this.on("update", () => {
      this.bypassed = user.permissions.hasPermission("quota.bypass." + this.name);

      this.values.forEach((z, i) => {
        if (
          user.permissions.hasPermission("quota.force." + this.name + "." + i)
        ) this.force = i;
      });

      this.selected = this.force;
    })

    this.emit("update");

    this.interval = setInterval(() => {
      let curr = values[this.selected];
      if (this.points < curr.max) {
        this.points += curr.allowance;
        if (this.points > curr.max) this.points = curr.max;
      }
    }, values[this.selected].interval);
  }

  getRaw() {
    if (this.bypassed) {
      return {
        allowance: 99999,
        max: 99999,
        interval: 1000,
      };
    }

    return this.values[this.selected];
  }

  isAvailable(amount = 1) {
    if (this.bypassed) return true;
    if (this.points < 0) return false;
    this.points -= amount;
    return true;
  }

  destroy() {
    clearInterval(this.interval as unknown as number);

    this.values = null;
    this.name = null;
    this.selected = null;
    this.force = null;
    this.interval = null;
    this.points = null;
    this.user = null;
    this.bypassed = null;
  }

  updateFlags(n: number) {
    this.selected = this.force || n;
    if (this.values.length <= this.selected) this.selected = 0;
    this.points = this.values[this.selected].max;
  }
}
