import User, { Tag } from "./User"; // TODO: add sitebanning
interface Rank {
  priority: number;
  permissions: string[];
  tag?: Tag;
}

export let validPermissions =
  `rooms.seeInvisibleRooms rooms.chownAnywhere vanish antibot.bypass rooms.chsetAnywhere * rooms.usersetOthers command.experms command.perms command.ranks command.generateToken rooms.seeDms command.addrank command.delrank command.addperm command.delperm command.settag command.deltag rooms.clearChat rooms.bypassLimit rooms.antiKickban quota.bypass.channelChange quota.force.channelChange.0 quota.bypass.userset quota.force.userset.0 quota.bypass.mouseMove quota.force.mouseMove.0 quota.bypass.chown quota.force.chown.0 quota.bypass.chat quota.force.chat.0 quota.force.chat.1 quota.force.chat.2 quota.bypass.dm quota.force.dm.0 quota.bypass.kickban quota.force.kickban.0 quota.bypass.note quota.force.note.0 quota.force.note.1 quota.force.note.2`
    .split(" ");

export const rankDefinitions: Record<string, Rank> = {
  "owner": {
    priority: 10,
    permissions: [
      "*",
    ],
    tag: {
      text: "OWNER",
      color: "#E60000",
    },
  },
  "admin": {
    priority: 9,
    permissions: [
      "*",
    ],
    tag: {
      text: "ADMIN",
      color: "#E68100",
    },
  },
  "moderator": {
    priority: 8,
    permissions: [
      "quota.bypass.kickban",
      "quota.force.note.2",
      "antibot.bypass",
      "command.experms",
      "command.perms",
      "command.ranks",
      "rooms.bypassLimit",
      "rooms.chownAnywhere",
      "rooms.chsetAnywhere",
      "rooms.usersetOthers",
      "rooms.seeDms",
      "rooms.clearChat",
      "rooms.antiKickban",
      "vanish",
      "rooms.seeInvisibleRooms",
    ],
    tag: {
      text: "MOD",
      color: "#E6CD00",
    },
  },
  "trusted": {
    priority: 7,
    permissions: [
      "antibot.bypass",
      "command.experms",
      "command.perms",
      "command.ranks",
      "quota.force.note.2",
    ],
    tag: {
      text: "TRUSTED",
      color: "#9EE600",
    },
  },
  "bot": {
    priority: 1,
    permissions: [
      "antibot.bypass",
      "quota.bypass.mouseMove",
    ],
    tag: {
      text: "BOT",
      color: "#5555FF",
    },
  },
};

export class Permissions {
  private user: User;
  private explicitPermissions: Set<string>;
  private explicitTag?: Tag;

  constructor(user: User, explicitPermissions: string[], tag?: Tag) {
    this.user = user;
    this.explicitPermissions = new Set(explicitPermissions);
    this.explicitTag = tag;
  }

  isValidPermission(permission: string) {
    return validPermissions.includes(permission);
  }
  addPermission(permission: string) {
    this.explicitPermissions.add(permission);
    this.user.commit();
  }
  setTag(text: string, color: string) {
    this.explicitTag = {
      text,
      color,
    };
    this.user.commit();
  }

  deleteTag() {
    this.explicitTag = undefined;
    this.user.commit();
  }
  deletePermission(permission: string) {
    this.explicitPermissions.delete(permission);
    this.user.commit();
  }

  hasPermission(permission: string): boolean {
    if (this.getPermissions().has("*")) return true;
    let parts = permission.split(".");

    // EXPLANATION:
    // let's say we have the permission quota.bypass.hi
    // and the user has the permission quota.bypass.*
    // the splitting and slice part would turn our `quota.bypass.hi` to
    // ["quota", "bypass"], then we would join together and add a .*
    // "quota.bypass.*" BOOOOOOM!!!!!!! WOWAWAH! Now we can compare with the user's permisions

    if (this.getPermissions().has(parts.slice(0, -1).join(".") + ".*")) {
      return true;
    }

    return this.getPermissions().has(permission);
  }

  mppcPermissions(): Record<string, true> {
    let returns: Record<string, true> = {};

    if (this.hasPermission("rooms.chownAnywhere")) {
      returns.chownAnywhere = true;
    }

    if (this.hasPermission("rooms.chsetAnywhere")) {
      returns.chsetAnywhere = true;
    }

    if (this.hasPermission("rooms.usersetOthers")) {
      returns.usersetOthers = true;
    }

    if (this.hasPermission("rooms.clearChat")) {
      returns.clearChat = true;
    }

    if (this.hasPermission("vanish")) {
      returns.vanish = true;
    }

    return returns;
  }

  getPermissions(): Set<string> {
    if (this.user.ranks.size == 0) return this.explicitPermissions;

    let rank = [...this.user.ranks].map((z) => rankDefinitions[z]).reduce(
      (a, b) => {
        return a.priority > b.priority ? a : b;
      },
    );

    return new Set([
      ...rank.permissions,
      ...this.explicitPermissions,
    ]);
  }

  getExplicitTag(): Tag | undefined {
    return this.explicitTag;
  }

  getExplicitPermissions(): Set<string> {
    return this.explicitPermissions;
  }

  getTag(): Tag {
    if (this.explicitTag || this.user.ranks.size == 0) return this.explicitTag;
    let rank = [...this.user.ranks].map((z) => rankDefinitions[z]).reduce(
      (a, b) => {
        return a.priority > b.priority ? a : b;
      },
    );

    return rank.tag;
  }
}
