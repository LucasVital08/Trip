import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Auth.js v5 — sessões JWT.
 * - Credenciais (e-mail/senha, bcrypt) sempre disponíveis.
 * - Google OAuth entra automaticamente quando AUTH_GOOGLE_ID/SECRET existem.
 *   (Apple segue o mesmo padrão quando houver conta de desenvolvedor.)
 */
const providers = [
  Credentials({
    name: "E-mail e senha",
    credentials: {
      email: { label: "E-mail", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").toLowerCase().trim();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.blockedAt) return null;
      const ok = await compare(password, user.passwordHash);
      if (!ok) return null;
      return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl };
    },
  }),
  ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? [Google] : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/entrar" },
  providers,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const account = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
      return !account?.blockedAt;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

export function hasGoogleOAuth(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
