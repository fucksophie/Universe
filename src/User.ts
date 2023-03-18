import { Database } from "bun:sqlite";
import { EventEmitter } from "events";

export const db = new Database("users.db");

import { Logger } from "./Logger";
import { Permissions } from "./Permissions";

export interface Tag {
  text?: string;
  color?: string;
}

export default class User extends EventEmitter {
  static logger = new Logger("User");
  _id!: string;
  color!: string;
  name!: string;

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
      };
    }) as {
      _id: string;
      color: string;
      name: string;
      tag: Tag;
      permissions: Set<string>;
      token: string;
      ranks: Set<string>;
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
    }[];
  }

  constructor(_id: string) {
    super();

    const data = User.userExists(_id);

    if (data.length == 0) {
      this._id = _id;
      this.color = crypto.randomUUID().replaceAll("-", "").substring(0, 6);
      this.name = "Anonycat";
      this.ranks = new Set();

      this.token = crypto.randomUUID().replaceAll("-", "");
      this.permissions = new Permissions(this, [], undefined);
      this.commit();
    } else {
      this._id = _id;
      this.color = data[0].color;
      this.name = data[0].name;
      let tag = JSON.parse(data[0].tag);

      if (tag == null) tag = undefined;

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
      let qq = db.query(
        `UPDATE users
            SET color = ?, name = ?, tag = ?, permissions = ?, token = ?, ranks = ?
            WHERE _id = ?;`,
      ).all(
        this.color,
        this.name,
        JSON.stringify(this.permissions.getExplicitTag()),
        JSON.stringify([...this.permissions.getExplicitPermissions()]),
        this.token,
        JSON.stringify([...this.ranks]),
        this._id,
      );
      qq = null;
    } else {
      let qq = db.query(`INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?);`).all(
        this._id,
        this.color,
        this.name,
        JSON.stringify(this.permissions.getExplicitTag()),
        JSON.stringify([...this.permissions.getExplicitPermissions()]),
        this.token,
        JSON.stringify([...this.ranks]),
      );
      qq = null;
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
            ranks TEXT
            )
        `);

    this.logger.success("Database running!");
  }
}
