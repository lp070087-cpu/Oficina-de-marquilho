#!/bin/bash
cd /sessions/adoring-practical-davinci/mnt/marquinho-projeto
rm -f /sessions/adoring-practical-davinci/mnt/marquinho-projeto/build-out.txt
npm run build > /sessions/adoring-practical-davinci/mnt/marquinho-projeto/build-out.txt 2>&1
echo "BUILD_EXIT=$?" >> /sessions/adoring-practical-davinci/mnt/marquinho-projeto/build-out.txt
