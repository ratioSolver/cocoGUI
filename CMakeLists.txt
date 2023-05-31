cmake_minimum_required(VERSION 3.0.0)
project(cocoGUI VERSION 1.0.0)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fsanitize=undefined")

set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)

include(GNUInstallDirs)
include(CMakePackageConfigHelpers)

set(COCO_HOST "127.0.0.1" CACHE STRING "The COCO Host")
set(COCO_PORT "8080" CACHE STRING "The COCO Port")

set(COCO_ROOT "CoCo-GUI" CACHE STRING "The COCO root" FORCE)

message(STATUS "CoCo GUI IP:            ${COCO_HOST}")
message(STATUS "CoCo GUI port:          ${COCO_PORT}")

set(RATIONET_INCLUDE_UTILS OFF CACHE BOOL "Include utils library" FORCE)

add_subdirectory(extern/rationet)
add_subdirectory(extern/coco)

file(GLOB COCO_SOURCES src/coco_gui.cpp)
file(GLOB COCO_HEADERS include/coco_gui.h)

add_library(${PROJECT_NAME} STATIC ${COCO_SOURCES})
target_include_directories(${PROJECT_NAME} PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>/include $<BUILD_INTERFACE:${CMAKE_CURRENT_BINARY_DIR}> $<INSTALL_INTERFACE:> ${Boost_INCLUDE_DIRS} ${CLIPS_INCLUDE_DIR} ${LIBMONGOCXX_INCLUDE_DIR} ${LIBBSONCXX_INCLUDE_DIR})
target_link_libraries(${PROJECT_NAME} PUBLIC ratioNet COCO)
target_compile_definitions(${PROJECT_NAME} PUBLIC COCO_HOST="${COCO_HOST}" COCO_PORT=${COCO_PORT})

add_executable(${PROJECT_NAME}Server src/main.cpp)
target_link_libraries(${PROJECT_NAME}Server PRIVATE ${PROJECT_NAME})

if(MSVC)
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
else()
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
endif()

install(
    TARGETS ${PROJECT_NAME}
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
)
install(
    FILES ${COCO_HEADERS} ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}_export.h
    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/${PROJECT_NAME}
)
configure_package_config_file(src/${PROJECT_NAME}Config.cmake.in ${PROJECT_NAME}Config.cmake INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME} PATH_VARS CMAKE_INSTALL_INCLUDEDIR)
write_basic_package_version_file(${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}ConfigVersion.cmake VERSION 1.0.0 COMPATIBILITY SameMajorVersion)
install(
    FILES ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}Config.cmake ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}ConfigVersion.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/${PROJECT_NAME}
)

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)