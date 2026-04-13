#!/bin/bash
cd /workspace/projects
pnpm install
pnpm run next build
pnpm run next export
