import { global } from "./index.ts";

const uri = global.uri;

async function mongoimport(
  { file }: { file: string },
) {
  const cmd = new Deno.Command("mongoimport", {
    args: [
      "--uri",
      uri,
      "--file",
      file,
    ],
  });

  const process = cmd.spawn();
  const { code, success } = await process.status;
  console.log(`mongoimport ${file} process exited with code ${code}`);

  if (!success) {
    throw new Error("mongoimport failed");
  }
}

export async function importData() {
  for await (const entry of Deno.readDir("./data/")) {
    if (entry.isFile) {
      const filepath = `./data/${entry.name}`;
      await mongoimport({ file: filepath });
    }
  }
}
