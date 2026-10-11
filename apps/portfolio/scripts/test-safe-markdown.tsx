import { renderToStaticMarkup } from "react-dom/server";

import { SafeMarkdown } from "../lib/markdown/safe-markdown";

const output = renderToStaticMarkup(
  <SafeMarkdown
    markdown={
      "# Safe\n<script>alert(1)</script>\n[bad](javascript:alert(1))\n[good](https://example.com/docs)\n![remote](https://example.com/a.png)"
    }
  />,
);

if (output.includes("<script") || output.includes("javascript:") || output.includes("<img")) {
  throw new Error("Unsafe Markdown output was rendered.");
}
if (!output.includes('href="https://example.com/docs"')) {
  throw new Error("Safe HTTPS link was not rendered.");
}
console.log(
  JSON.stringify({
    status: "ready",
    rawHtml: "escaped",
    unsafeLinks: "blocked",
    remoteImages: "blocked",
  }),
);
