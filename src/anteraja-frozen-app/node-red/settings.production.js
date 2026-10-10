module.exports = {
  uiHost: "127.0.0.1",
  uiPort: 1880,
  credentialSecret: process.env.NODE_RED_CREDENTIAL_SECRET,
  adminAuth: {
    type: "credentials",
    users: [
      {
        username: process.env.NODE_RED_ADMIN_USERNAME || "admin",
        password: process.env.NODE_RED_ADMIN_PASSWORD_HASH,
        permissions: "*",
      },
    ],
  },
};
