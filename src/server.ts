import express from "express";
const cors = require("cors");

import { ENV } from "./utils/env";

import { filesRoutes } from "./api/files/files.controller";
import { authRoutes } from "./api/auth/auth.controller";
import { permissionRoutes } from "./api/permissions/permissions.controller";

const app = express();
app.use(express.json());
app.use(cors());

app.use(authRoutes);
app.use(filesRoutes);
app.use(permissionRoutes);

app.get("/health", async (req, res) => {
  res.send("All good");
});

app.listen(ENV.SERVER_PORT, () => {
  console.log(`Serving app on port ${ENV.SERVER_PORT}`);
});
