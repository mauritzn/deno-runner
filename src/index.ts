import { existsSync, colorLog, logError } from "./utils.ts";
import { Project, ProjectConfig } from "./interfaces.ts";

class DenoRunner {
  readonly version = "0.0.2";
  readonly configFile = `deno_config.json`;
  readonly importMapFile = `import_map.json`;

  readonly validPermissions: string[] = [
    "allow-env",
    "allow-hrtime",
    "allow-net",
    "allow-read",
    "allow-run",
    "allow-write",
  ];
  readonly watchFsEvents = [
    "create",
    "modify",
    "remove",
  ];

  private runOptions = {
    watchMode: false,
    imports: false,
    unstableFlag: false,
  };
  argsToPass: string[] = [];

  project: Project = {
    folderPath: "",
    configPath: "",
    importMapPath: "",
    mainFilePath: "",
    runCommand: [],

    config: {
      name: undefined,
      description: undefined,
      version: undefined,
      author: undefined,
      main: "",
      unstableFlag: false,
      permissions: [],
      imports: {},
    },
  };
  denoProcess: Deno.Process | undefined;

  constructor(args: string[]) {
    if (this.parseArgs(args)) {
      this.project.folderPath = Deno.cwd();
      this.project.configPath = `${this.project.folderPath}/${this.configFile}`;
      this.project.importMapPath =
        `${this.project.folderPath}/${this.importMapFile}`;

      if (existsSync(this.project.configPath)) {
        if (this.parseConfigFile()) {
          if (this.runOptions.imports) {
            colorLog(
              [
                "Info:",
                "This project will run using Deno import maps (with --unstable flag)",
              ],
              "cyan",
            );
          }
          if (this.runOptions.unstableFlag) {
            colorLog(
              [
                "Warning:",
                "This project will run using the Deno --unstable flag",
              ],
              "yellow",
            );
          }
          if (this.runOptions.imports || this.runOptions.unstableFlag) {
            console.log("");
          }

          this.permissionRequest().then(() => {
            const permissionString = this.project.config.permissions.map((
              permission,
            ) => `--${permission}`)
              .join(" ").trim();
            this.project.runCommand = ["deno", "run"];
            if (permissionString.length > 0) {
              this.project.runCommand.push(permissionString);
            }

            if (this.runOptions.imports) {
              let importMapObj = {
                imports: (this.project.config.imports
                  ? this.project.config.imports
                  : {}),
              };

              Deno.writeTextFileSync(
                this.project.importMapPath,
                JSON.stringify(importMapObj),
              );
              // https://deno.land/manual/linking_to_external_code/import_maps
              this.project.runCommand.push(
                `--importmap=${this.project.importMapPath}`,
              );
              this.runOptions.unstableFlag = true;
            }

            if (this.runOptions.unstableFlag) {
              this.project.runCommand.push("--unstable");
            }
            this.project.runCommand.push(this.project.mainFilePath);

            colorLog(["Run", `${this.project.mainFilePath}\n`], "green");
            this.runProject();
          }).catch(() => {
            colorLog(">> Permissions rejected! <<", "yellow");
          });
        }
      } else {
        logError(
          `Could not find config file, please make sure the file exists (${this.project.configPath}).`,
        );
      }
      //console.log("args to pass:", this.argsToPass);
    }
  }

  async runProject() {
    this.denoProcess = Deno.run({
      cmd: this.project.runCommand,
      cwd: this.project.folderPath,
      stdout: "piped",
    });

    if (this.runOptions.watchMode) this.startWatcher();

    let p = new Uint8Array(1);
    while (await this.denoProcess.stdout?.read(p) !== null) {
      Deno.stdout.writeSync(p);
      p = new Uint8Array(1);
    }
  }

  async startWatcher() {
    let lastEvent = 0;
    const watcher = Deno.watchFs(this.project.folderPath);
    for await (const event of watcher) {
      const currentEvent = Date.now();
      if (
        this.watchFsEvents.includes(event.kind) &&
        (currentEvent - lastEvent > 100)
      ) {
        lastEvent = currentEvent;
        this.denoProcess?.close();

        colorLog("\n>> Project change detected, restarting... <<", "cyan");
        this.runProject();
        break;
      }
    }
  }

  permissionRequest() {
    return new Promise(async (resolve, reject) => {
      const permissions = this.project.config.permissions;
      if (permissions.length > 0) {
        let formattedPermissions: string[] = [];
        permissions.map((permission) => {
          formattedPermissions.push(`  - ${permission}`);
        });

        colorLog(
          "The following permissions are required to run this project:",
          "yellow",
        );
        console.log(formattedPermissions.join("\n"));
        console.log("\nContinue (y/N)?");

        let buffer = new Uint8Array(100);
        const input = await Deno.stdin.read(buffer);
        if (input) {
          const answer = new TextDecoder().decode(buffer.subarray(0, input))
            .trim()
            .toLowerCase();

          switch (answer) {
            case "y":
            case "yes":
              // TODO: add question if answer should be remembered (unless permissions have changed)
              resolve();
              break;

            default:
              reject();
              break;
          }
        } else {
          reject();
        }
      } else {
        resolve();
      }
    });
  }

  parseConfigFile(): boolean {
    const plainData = Deno.readTextFileSync(this.project.configPath);
    let objData: ProjectConfig | null = null;
    try {
      objData = JSON.parse(plainData);
    } catch (err) {
      return logError(
        `Could not parse config file (${this.project.configPath})!`,
      );
    }

    if (objData && "main" in objData) {
      this.project.mainFilePath = `${this.project.folderPath}/${
        objData["main"].trim().replace(/^[.][/]/i, "")
      }`;
      if (existsSync(this.project.mainFilePath)) {
        for (const key in objData) {
          if (key in objData) {
            if (key in this.project.config) {
              this.project.config[key] = objData[key];

              switch (key) {
                case "permission":
                  this.project.config[key] =
                    (this.project.config[key] as string[]).filter(
                      (permission) => {
                        const splitPermission = permission.split("=");
                        if (splitPermission.length <= 2) {
                          const valid = this.validPermissions.includes(
                            splitPermission[0].toLowerCase(),
                          );
                          if (valid) return true;
                          else {
                            colorLog(
                              `!! Invalid permission: ${permission} !!`,
                              "red",
                            );
                          }
                        } else {
                          colorLog(
                            `!! Invalid permission: ${permission} !!`,
                            "red",
                          );
                        }
                        return false;
                      },
                    );
                  break;

                case "imports":
                  this.runOptions.imports = true;
                  break;

                case "unstableFlag":
                  if (this.project.config[key] === true) {
                    this.runOptions.unstableFlag = true;
                  }
                  break;
              }
            }
          }
        }
        return true;
      } else {
        return logError(
          `Missing main file (${this.project.mainFilePath})!`,
        );
      }
    } else {
      return logError(
        `Missing main field in config file (${this.project.configPath})!`,
      );
    }
  }

  parseArgs(args: string[]): boolean {
    let splitFound = false;
    let haltRun = false;
    let errors: string[] = [];

    args.map((arg) => {
      const formatted = arg.trim().toLowerCase();
      if (!splitFound && formatted === "--") {
        splitFound = true;
        return;
      }

      if (splitFound) {
        this.argsToPass.push(arg);
      } else {
        switch (formatted) {
          case "-h":
          case "--help":
            this.printHelp();
            haltRun = true;
            break;

          case "-v":
          case "--version":
            console.log(this.version);
            haltRun = true;
            break;

          case "-w":
          case "--watch":
            this.runOptions.watchMode = true;
            break;

          default:
            errors.push(`Provided argument "${arg}" is not valid`);
            haltRun = true;
            break;
        }
      }
    });

    if (errors.length > 0) {
      errors.map((error) => {
        logError(error);
      });
      console.log(`\nUSAGE:
    deno-runner [OPTIONS] -- [ARGS]
    
For more information try --help`);
    }

    return (haltRun ? false : true);
  }

  printHelp(): void {
    console.log(`deno-runner ${this.version}
Simple Deno runner to make running larger projects easier.

USAGE:
    deno-runner [OPTIONS] -- [ARGS]

OPTIONS:
    -h, --help
            Prints help information (this screen)

    -w, --watch
            Starts project in watch mode

    -v, --version
            Prints version information`);
  }
}

new DenoRunner(Deno.args);
