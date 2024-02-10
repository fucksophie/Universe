
export interface ChannelSettings {
  chat?: boolean;
  /**
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  color?: string;
  /**
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  color2?: string;
  visible?: boolean;
  limit?: number;
  crownsolo?: boolean;
  "no cussing"?: boolean;
  minOnlineTime?: number;
  lobby?: boolean;
}
interface MessageHi {
  m: "hi";
  token?: string;
  code?: any;
  login?: {
    type: string;
    code: string;
  };
}
interface MessageDevices {
  m: "devices"
  list?: any[]
}
interface MessageVanish {
  m: "v";
  vanish: boolean;
}
interface MessageChannel {
  m: "ch";
  /**
   * @maximum 50
   */
  _id: string;
  set?: ChannelSettings;
}
interface MessageChannelSet {
  m: "chset";
  set: ChannelSettings;
}
interface MessageChangeOwner {
  m: "chown";
  id?: string;
}
interface MessageBye {
  m: "bye";
}
interface MessageMouse {
  m: "m";
  x: number;
  y: number;
}
interface MessageSetName {
  m: "setname";
  _id: string;
  /**
   * @maximum 250
   */
  name: string;
}
interface MessageSetColor {
  m: "setcolor";
  _id: string;
  /**
   * @pattern ^#(?:[0-9a-fA-F]{3}){1,2}$
   */
  color: string;
}
interface MessageKickBan {
  m: "kickban";
  _id: string;
  ms?: number;
}
interface MessageClearChat {
  m: "clearchat";
}
interface MessageDM {
  m: "dm";
  /**
   * @maximum 512
   */
  message: string;
  _id: string;
  reply_to?: string;
}
interface MessageA {
  m: "a";
  /**
   * @maximum 512
   */
  message: string;
  reply_to?: string;
}
interface MessageNotes {
  m: "n";
  t?: number;
  n: { n: string; d?: number; s?: number; v?: number }[];
}
interface MessageTime {
  m: "t"
  e?: number
}
interface MessageSubscribeChannelList {
  m: "+ls"
}
interface MessageUnsubscribeChannelList {
  m: "-ls"
}
interface MessageSubcribeCustom {
  m: "+custom"
}
interface MessageUnsubscribeCustom {
  m: "-custom"
}
interface MessageUserset {
  m: "userset"
  set: {
    name: string;
    color: string;
  }
}
interface CustomTarget {
  global?: boolean
}
interface CustomTargetSubscribed extends CustomTarget {
  mode: "subscribed"
}
interface CustomTargetId extends CustomTarget{
  mode: "id"
  id: string
}
interface CustomTargetIds extends CustomTarget {
  mode: "ids"
  ids: string[]
}
interface MessageCustom {
  m: "custom"
  data: any
  target: CustomTargetSubscribed | CustomTargetId | CustomTargetIds
}
export type Message =
  | MessageHi
  | MessageVanish
  | MessageChannel
  | MessageChannelSet
  | MessageChangeOwner
  | MessageBye
  | MessageMouse
  | MessageSetColor
  | MessageSetName
  | MessageKickBan
  | MessageClearChat
  | MessageDM
  | MessageA
  | MessageNotes
  | MessageTime
  | MessageSubscribeChannelList
  | MessageUnsubscribeChannelList
  | MessageSubcribeCustom
  | MessageUnsubscribeCustom
  | MessageUserset
  | MessageCustom
  | MessageDevices;
