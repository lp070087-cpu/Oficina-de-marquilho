#!/bin/bash
cd /sessions/adoring-practical-davinci/mnt/marquinho-projeto
npx next build > /sessions/adoring-practical-davinci/mnt/marquinho-projeto/build-output.txt 2>&1
echo "BUILD_EXIT_CODE=$?" >> /sessions/adoring-practical-davinci/mnt/marquinho-projeto/build-output.txt
