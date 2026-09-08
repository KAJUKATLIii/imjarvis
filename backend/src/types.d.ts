import { Role } from './config/constants';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    discordId: string;
    username: string;
    role: Role;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        discordId: string;
        username: string;
        role: Role;
      };
    }
  }
}

export {};
