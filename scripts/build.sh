#!/bin/bash
cd "$(dirname "$0")/.."
pnpm install
pnpm run build
pnpm run export
