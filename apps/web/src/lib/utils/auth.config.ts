import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbService } from '../db/db.service';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(dbService.getPrisma()),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        const user = await dbService.getPrisma().user.findUnique({
          where: { username },
        });

        if (!user) throw new Error('Usuário não encontrado!');
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('Usuário ou senha inválidos!');

        return {
          id: user.id.toString(),
          username: user.username,
          email: user.email ?? '',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60,
    updateAge: 30 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
