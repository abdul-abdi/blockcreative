import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models';
import { v4 as uuidv4 } from 'uuid';

// Define custom user type
interface CustomUser {
  id: string;
  address: string;
  role: string;
  onboarding_completed: boolean;
  onboarding_step: number;
}

// Extend next-auth types
declare module "next-auth" {
  interface User extends CustomUser {}
  interface Session {
    user: CustomUser & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT extends CustomUser {}
}

// Configure NextAuth
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      id: 'reown-wallet',
      name: 'Reown Wallet',
      credentials: {
        address: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.address) {
          return null;
        }

        try {
          // Connect to database
          await connectToDatabase();

          // Check if user exists
          let user = await User.findOne({ address: credentials.address });

          // If user doesn't exist, create a new one
          if (!user) {
            user = new User({
              id: `user_${uuidv4()}`,
              address: credentials.address,
              role: 'unassigned', // Role will be set during onboarding
              created_at: new Date(),
              profile_data: {},
              onboarding_completed: false,
              onboarding_step: 1
            });
            await user.save();
          }

          // Return user data for session
          return {
            id: user.id,
            address: user.address,
            role: user.role,
            onboarding_completed: user.onboarding_completed,
            onboarding_step: user.onboarding_step
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to JWT token
      if (user) {
        token.id = user.id;
        token.address = user.address;
        token.role = user.role;
        token.onboarding_completed = user.onboarding_completed;
        token.onboarding_step = user.onboarding_step;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          address: token.address,
          role: token.role,
          onboarding_completed: token.onboarding_completed,
          onboarding_step: token.onboarding_step
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 