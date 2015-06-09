cmake_minimum_required ( VERSION 2.6 )
project (voter)

subdirs (
	external/koohar
)

if (${CMAKE_SYSTEM_NAME} MATCHES "Linux" OR ${CMAKE_SYSTEM_NAME} MATCHES "FreeBSD" OR ${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
	set (warnings "-Wall -Wextra -Woverloaded-virtual")
	set (common_flags "-std=c++0x -fPIC")
  if (${CMAKE_SYSTEM_NAME} MATCHES "FreeBSD" OR ${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    set (clang_flags "-stdlib=libc++")
  endif (${CMAKE_SYSTEM_NAME} MATCHES "FreeBSD" OR ${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
	set (CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} ${warnings} ${common_flags} ${clang_flags}")
	set (CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} ${warnings} ${comon_flags} ${clang_flags} -g -ggdb")
	set (CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} ${warnings} ${common_flags} ${clang_flags} -O2")
elseif (${CMAKE_SYSTEM_NAME} MATCHES "Windows")
endif (${CMAKE_SYSTEM_NAME} MATCHES "Linux" OR ${CMAKE_SYSTEM_NAME} MATCHES "FreeBSD" OR ${CMAKE_SYSTEM_NAME} MATCHES "Darwin")

if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
  include_directories (
    /opt/local/include
  )
  link_directories (
    /opt/local/lib
  )
endif (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")

set(EXECUTABLE_OUTPUT_PATH ${CMAKE_SOURCE_DIR}/build)
set(LIBRARY_OUTPUT_PATH ${CMAKE_SOURCE_DIR}/lib)

set (external_libs
	koohar
)

set (voter_libs
	${external_libs}
	pthread
	ssl
	boost_system-mt
)

include_directories (
	external/koohar/src
)

link_directories (${CMAKE_SOURCE_DIR}/lib)

set ( voter_src
  src/commands_handler.cc
  src/commands_handler.hh
  src/handler.cc
  src/handler.hh
  src/room.cc
  src/room.hh
  src/room_manager.cc
  src/room_manager.hh
  src/router.cc
  src/router.hh
  src/user.cc
  src/user.hh
  src/utils.hh
  src/voter.cc
)

add_executable ( voter ${voter_src} )
target_link_libraries ( voter ${voter_libs} )
