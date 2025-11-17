#!/usr/bin/env node
/*
 * MIT License
 *
 * Copyright (c) 2025 KRI, LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { displayStartBanner } from "./banner.js";
import {
  IRuntimeConfig,
  loadConfig
} from "./RuntimeConfig.js";
import { 
  Command, 
  Option 
} from "commander";
import path from "node:path";
import { createContext, IContext } from "./Context.js";
import { createRuntime } from "./Runtime.js";

function parseKvpList(value: string) {
  const _pairs = value.split(",");
  const _map: Record<string, string> = {};
  for(const p of _pairs) {
      const [k, v] = p.split("=", 2);
      if (!k || v === undefined) throw new Error(`Invalid KVP: ${p}`);
      _map[k] = v;
  }
  return _map;
}

const program = new Command()
    .name("stratoform")
    .description("Run Stratoform cloud platform deployment definitions.")
    .version("0.1.0");

program
    .option("--config-path <path>",  "Stratoform config path [./statoconfig.json]",    path.join(process.cwd(), "statoconfig.json"))
    .option("--define",              "Only define infrastructure state.",              false)
    .option("--log-days <days>",     "The maximum number of days a log file is kept.", path.join("20"))
    .addOption(
      new Option("--log-level <level>", "Set log verbosity")
        .choices(["verbose", "debug", "info", "warn", "error"])
        .default("info")
    )
    .addOption(
      new Option("--log-output <output>", "Set log output to file, console, or both")
        .choices(["file", "console", "both"])
        .default("file")
    )
    .option("--log-path <logPath>",          "The path to the log file.",                      path.join(process.cwd(), "logs"))
    .option("--log-size <size>",             "The maximum file size in MB.",                   "1")
    .option("--log-zip",                     "Use zip archive to preserve logs.",              true)
    .option("--speculate",                   "Only speculate infrastructure state.",           false)
    .option("--silent",                      "Run headless with no CLI inpout oroutput.",      false)
    .option("--unlock <alias>",              "Unlocks resource for delete or modification.")
    .option("--unlock-all",                  "Unlocks resources for delete or modification.",  false)
    .option("--working-directory <dir>",     "Unlocks resources for delete or modification.",  process.cwd())
    .option("--validate",                    "Only Validate infrastructure state.",            false)
    .option("--variable-path <path>",        "Path to JSON variable file.")
    .option("--variables <k1=v1,k2=v2,...>", "Set multiple valriables by key=value.",          parseKvpList)
 
    .action(async (opts) => {
        displayStartBanner(opts.silent);
        const _RuntimeConfig:  IRuntimeConfig = loadConfig(opts);
        const _RuntimeContext: IContext       = createContext(_RuntimeConfig, program, opts);

        _RuntimeContext.log.info("Stratoform started. May the force live long and prosper.");
        _RuntimeContext.log.debug(`Log level set to '${_RuntimeContext.log.level}'.`);
        _RuntimeContext.log.debug(`Confgiuration loaded from '${_RuntimeContext.config.configPath}'.`);

        const _Runtime = createRuntime(_RuntimeContext);

        try {
            await _Runtime.run();
        }
        catch(err) {
            _RuntimeContext.log.error(err);
            throw err;
        }
    });



program.parseAsync()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
