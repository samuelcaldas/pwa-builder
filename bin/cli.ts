#!/usr/bin/env node
import { parseCliArgs, executeCliCommand } from "./cli-core.js";

async function main(): Promise<void> {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    const output = await executeCliCommand(options);
    console.log(output);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

void main();
