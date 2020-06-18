# Deno-runner

Simple Deno runner to make running larger projects easier. Built using Deno *(TypeScript)*.

**Features:**
  - Permission request before run
  - Watch mode *(-w / --watch)*

-----

## Installing / Running Deno-runner

Deno-runner runs best after being installed using Deno. Deno-runner can be run without installing, but will require you to either create an alias or your own execution script.

Due to how `deno install` works the deno-runner folder should not be moved after installation. If the `index.ts` file is not in the same place anymore you will get the following error: `Cannot resolve module "file:///home/<USER>/deno-runner/src/index.ts"`. This is simple enough to fix, either reinstall Deno-runner or create a symlink at the old location.

An installation script is provided but if you want to do it manually or change the name that it installs under use the following command:

```bash
deno install --allow-read --allow-run -n deno-runner ./src/index.ts
```

If you want to run Deno-runner without installing you can use a simple run script. The script should use an absolute path to Deno-runner. `$@` is used to pass any provided arguments to Deno-runner. `$HOME` can also be used like in the example below:

```bash
#!/bin/bash
deno run --allow-read --allow-run "$HOME/deno-runner/src/index.ts" "$@"
```

-----

## Updating Deno-runner

Due to how `deno install` works you shouldn't have to run the install script again, as long as the installation folder is the same. So if your current installation of Deno-runner is in `/home/<USER>/deno-runner` and the update is in `/home/<USER>/Downloads/deno-runner`, then you either need to reinstall Deno-runner or replace the old one with the new one.

-----

## Uninstalling Deno-runner

I haven't provided an uninstall script since this process would be slightly different for everyone and sadly Deno doesn't provide an uninstall option *(at least not yet)*. So please keep note of where Deno placed Deno-runner when it installed it.

Uninstalling Deno-runner is as simple as removing the file placed by `deno install`, for more information please check out [Deno's manual](https://deno.land/manual/tools/script_installer).

**Example deno install output:**
```
Compile file:///home/<USER>/deno-runner/src/index.ts
✅ Successfully installed deno-runner
/home/<USER>/.deno/bin/deno-runner
```

-----

## Project setup

To run your Deno project using this Deno-runner simply add a config file named: `deno_config.json`

For more information on `deno_config.json` go to the [deno-config](https://github.com/mauritzn/deno-config) repo.

In the future I might add an `init` command to make this process easier.

**Most basic config file:**
```json
{
  "main": "index.ts"
}
```

-----

## Config file

The Deno config file used by Deno-runner is a JSON file named `deno_config.json`, this structure of this file is laid out in the [deno-config](https://github.com/mauritzn/deno-config) repo.

Currently Deno-runner only uses 2 properties from the config file, `main` and `permissions`. In the future I plan to support more options.

**Example config file:**
```json
{
  "name": "simple_demo",
  "description": "Simple demo for config file",
  "version": "1.0.0",
  "author": "Mauritz N",
  "main": "server.ts",
  "permissions": [
    "allow-net=mauritzonline.com",
    "allow-read"
  ],
  "imports": {
    "fmt/": "https://deno.land/std@0.55.0/fmt/"
  }
}
```