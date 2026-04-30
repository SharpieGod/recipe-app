import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "~/env";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    DiscordProvider({
      clientId: env.AUTH_DISCORD_ID,
      clientSecret: env.AUTH_DISCORD_SECRET,
      authorization: {
        url: "https://discord.com/api/oauth2/authorize",
        params: { scope: "identify email" },
      },
    }),
    {
      id: "hackclub",
      name: "Hack Club",
      type: "oauth",
      clientId: env.AUTH_HACKCLUB_ID,
      clientSecret: env.AUTH_HACKCLUB_SECRET,
      authorization: {
        url: "https://auth.hackclub.com/oauth/authorize",
        params: { scope: "openid name", response_type: "code" },
      },
      checks: ["none"],
      token: {
        url: "https://auth.hackclub.com/oauth/token",
        conform: async (response: Response) => {
          const json = (await response.json()) as Record<string, unknown>;
          delete json.id_token; // drop the JWT so Auth.js doesn't try to validate it
          return Response.json(json, response);
        },
      },
      userinfo: {
        url: "https://auth.hackclub.com/api/v1/me",
      },
      profile(profile) {
        return {
          id: String(profile.identity.id),
          name: `${profile.identity.first_name} ${profile.identity.last_name.charAt(0)}`,
          image: null,
        };
      },
    },
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
