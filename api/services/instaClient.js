import { IgApiClient } from "instagram-private-api";
import dotenv from "dotenv";
dotenv.config();

const ig = new IgApiClient();

async function loginInstagram() {
  try {
    ig.state.generateDevice(process.env.IG_USERNAME);

    const auth = await ig.account.login(
      process.env.IG_USERNAME,
      process.env.IG_PASSWORD
    );

    console.log("✅ Instagram login success:", auth.username);

    return ig;
  } catch (err) {
    console.error("❌ Instagram login failed:", err.message);
    throw err;
  }
}

export default loginInstagram;
