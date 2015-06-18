# voter
Voter is a web service to run online votes

To build run:
cmake . -B./cmake_build
make -jN -C cmake_build

To run just change dir to build and run ./voter

Make sure you've got clang and libc++ for backend and tsc available in PATH to
build frontend.
