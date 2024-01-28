import { ChannelSettings } from "./Channel";

interface MessageHi {
  m: "hi";
  token: string;
  login: {
    type: string;
    code: string;
  };
}
interface MessageVanish {
  m: "v";
  vanish: boolean;
}
interface MessageChannel {
  m: "ch";
  _id: string;
  set: ChannelSettings;
}
interface MessageChannelSet {
  m: "chset";
  set: ChannelSettings;
}
interface MessageChangeOwner {
  m: "chown";
  id: string;
}
interface MessageBye {
  m: "bye";
}
interface MessageMouse {
  m: "m";
  x: number | string;
  y: number | string;
}
interface MessageSetName {
  m: "setname";
  _id: string;
  name: string;
}
interface MessageSetColor {
  m: "setcolor";
  _id: string;
  color: string;
}
interface MessageKickBan {
  m: "kickban";
  _id: string;
  ms: number;
}
interface MessageClearChat {
  m: "clearchat";
}
interface MessageDM {
  m: "dm";
  message: string;
  _id: string;
  reply_to?: string;
}
interface MessageA {
  m: "a";
  message: string;
  reply_to?: string;
}
interface MessageNotes {
  m: "n";
  t: number;
  n: { n: string; d?: number; s?: number; v: number }[];
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
interface CustomTargetSubscribed {
  mode: "subscribed"
  global?: boolean
}
interface CustomTargetId {
  mode: "id"
  id: string
  global?: boolean

}
type CustomTarget = CustomTargetSubscribed | CustomTargetId
interface MessageCustom {
  m: "custom"
  data: any
  target: CustomTarget
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
  | MessageCustom;
