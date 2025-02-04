import { parseArgs } from "jsr:@std/cli";

let args: {
  [index: string]: string | undefined;
};
if (Deno.args.length > 0) {
  args = parseArgs(Deno.args);
} else {
  args = Deno.env.toObject();
}
console.log(args);
const uri = args.uri;
const mode = args.mode;

if (!uri) {
  throw new Error("Missing required argument: uri");
}

export const global = globalThis as {
  uri: string;
} & typeof globalThis;

global.uri = uri;

const modes = ["export", "import", "exportRewrite"];

if (!mode) {
  throw new Error("Missing required argument: mode");
}

if (!modes.includes(mode)) {
  throw new Error(
    `Invalid mode, available modes are ${modes.join(", ")}`,
  );
}

async function main() {
  if (mode === "export") {
    const teamId = args.teamId;
    if (!teamId) {
      throw new Error("Missing required argument: teamId");
    }
    const module = await import("./export.ts");
    await module.exportData(String(teamId));
    console.log("Data exported successfully");
  } else if (mode === "import") {
    const module = await import("./import.ts");
    await module.importData();
    console.log("Data imported successfully");
  } else if (mode === "exportRewrite") {
    const teamId = args.teamId;
    if (!teamId) {
      throw new Error("Missing required argument: teamId");
    }
    const newTeamId = args.newTeamId;
    if (!newTeamId) {
      throw new Error("Missing required argument: newTeamId");
    }
    const newTmbId = args.newTmbId;
    if (!newTmbId) {
      throw new Error("Missing required argument: newTmbId");
    }

    const module = await import("./export.ts");
    await module.rewrite({
      teamId: String(teamId),
      newTeamId: String(newTeamId),
      newTmbId: String(newTmbId),
    });
    console.log("Data exported successfully");
  }
  const sleep = new Deno.Command("sleep", { args: ["infinity"] });
  await sleep.output();
}

(() => main())();
