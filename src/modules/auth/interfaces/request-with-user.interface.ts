import { Request } from "express";
import { User } from "@prisma/client";

export interface RequestWithUser extends Request {
  user: User;
}

export interface HandshakeHeaders {
  authorization?: string;
}

export interface SocketIOHandshake {
  headers: HandshakeHeaders;
}

export interface SocketIORequest extends Request {
  handshake: SocketIOHandshake;
}
