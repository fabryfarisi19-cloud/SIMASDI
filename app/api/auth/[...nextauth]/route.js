 debug: true,

  callbacks: {
    async session({ session }) {
      console.log("SESSION CALLBACK:", session);
      return session;
    },
  },
});

export { handler as GET, handler as POST };