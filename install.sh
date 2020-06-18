#!/bin/bash
deno install --allow-read --allow-write --allow-run -n deno-runner $1 ./src/index.ts