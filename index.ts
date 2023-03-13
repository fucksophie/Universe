/*
boostraps a static function inside of User which starts up the database
also starts up the Server after that
*/

// Quick context to this comment ^^
// It was the first comment I wrote in this whole project
// I was laying out all of the classes that the server would need
// like Particpiant, Client, Channel, Server, User etc...

import Server from "./src/Server";
import User from "./src/User";

import { display } from "./src/Console";

await display();

const server = new Server();

User.bootstrapDatabase();
server.start();
