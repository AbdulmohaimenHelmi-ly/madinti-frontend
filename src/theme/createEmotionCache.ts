import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";

export default function createEmotionCache(direction: "rtl" | "ltr") {
  if (direction === "rtl") {
    return createCache({
      key: "muirtl",
      stylisPlugins: [prefixer, rtlPlugin],
    });
  }
  return createCache({ key: "mui" });
}
