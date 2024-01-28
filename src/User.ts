import { Database } from "bun:sqlite";
import { EventEmitter } from "events";

export const db = new Database("users.db");

import { Logger } from "./Logger";
import { Permissions } from "./Permissions";

export interface Tag {
  text?: string;
  color?: string;
}

export interface Punishment {
  punishmentBy: string; // userID
  punishmentId: string; // random UUID4/5 given to punishments
  punishmentTime: number; // Time punishment given out
  duration: number; // Time punishment will last, -1 is permanent
  reason: string; // 128 character long reason why user was punished
  note: string; // 512 character long reason for staff, extra information such as proof
}

export interface BanPunishment extends Punishment {
  type: "ban";
}

export function hasPunishmentExpired(punishment: Punishment) {
  return (punishment.punishmentTime + punishment.duration) - Date.now() < 0;
}

export default class User extends EventEmitter {
  static logger = new Logger("User");
  _id!: string;
  color!: string;
  name!: string;

  punishments?: Punishment[]

  permissions?: Permissions;
  ranks?: Set<string>;
  
  token?: string;
  vanished: boolean;

  static getToken(token: string) {
    return db.prepare(
      `
            SELECT * FROM users WHERE token = ?
        `,
    ).all(token).map((z: any) => {
      return {
        ...z,
        tag: JSON.parse(z.tag),
        permissions: new Set(JSON.parse(z.permissions)),
        ranks: new Set(JSON.parse(z.ranks)),
        punishments: JSON.parse(z.punishments)
      };
    }) as {
      _id: string;
      color: string;
      name: string;
      tag: Tag;
      permissions: Set<string>;
      token: string;
      ranks: Set<string>;
      punishments: Punishment[]
    }[];
  }

  static userExists(
    _id: string,
  ): {
    _id: string;
    color: string;
    name: string;
    tag: string;
    permissions: string;
    token: string;
    ranks: string;
    punishments: string;
  }[] {
    return db.prepare(
      `
            SELECT * FROM users WHERE _id = ?
        `,
    ).all(_id) as {
      _id: string;
      color: string;
      name: string;
      tag: string;
      permissions: string;
      token: string;
      ranks: string;
      punishments: string;
    }[];
  }

  constructor(_id: string) {
    super();

    const data = User.userExists(_id);

    if (data.length == 0) {
      const userCount = db.query("SELECT COUNT(_id) FROM users").get()["COUNT(_id)"];

      this._id = _id;
      this.color = crypto.randomUUID().replaceAll("-", "").substring(0, 6);
      this.name = "Anonycat";
      this.ranks = new Set();
      if(userCount == 0) this.ranks.add("owner")
      this.punishments = []

      this.token = crypto.randomUUID().replaceAll("-", "");
      this.permissions = new Permissions(this, [], undefined);
      this.commit();
    } else {
      this._id = _id;
      this.color = data[0].color;
      this.name = data[0].name;
      let tag = JSON.parse(data[0].tag);

      if (tag == null) tag = undefined;

      this.punishments = JSON.parse(data[0].punishments);

      this.ranks = new Set(JSON.parse(data[0].ranks));
      this.token = data[0].token;
      this.permissions = new Permissions(
        this,
        JSON.parse(data[0].permissions),
        tag,
      );
    
    }
  }

  commit() {
    if (User.userExists(this._id).length !== 0) {
      db.query(
        `UPDATE users
            SET color = ?, name = ?, tag = ?, permissions = ?, token = ?, ranks = ?, punishments = ?
            WHERE _id = ?;`,
      ).all(
        this.color,
        this.name,
        JSON.stringify(this.permissions.getExplicitTag()),
        JSON.stringify([...this.permissions.getExplicitPermissions()]),
        this.token,
        JSON.stringify([...this.ranks]),
        JSON.stringify(this.punishments),
        this._id,
      );
    } else {
      db.query(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?);`).all(
        this._id,
        this.color,
        this.name,
        JSON.stringify(this.permissions.getExplicitTag()),
        JSON.stringify([...this.permissions.getExplicitPermissions()]),
        this.token,
        JSON.stringify([...this.ranks]),
        JSON.stringify(this.punishments),
      );
    }

    this.emit("update");
  }

  static bootstrapDatabase() {
    this.logger.info("Bootstrapping database!");
    db.exec(`
            CREATE TABLE IF NOT EXISTS users (
            _id TEXT PRIMARY KEY,
            color TEXT,
            name TEXT,
            tag TEXT,
            permissions TEXT,
            token TEXT,
            ranks TEXT,
            punishments TEXT
            )
        `);

    this.logger.success("Database running!");
  }
}
