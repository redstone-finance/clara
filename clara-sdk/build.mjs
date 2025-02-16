import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.mjs"],
    bundle: true,
    outfile: "lib/index.cjs",
    platform: "node",
    target: "esnext",
    sourcemap: true,
  })
  .then(() => console.log("Build successful!"))
  .catch((error) => {
    console.error("Build failed:", error);
    process.exit(1);
  });
