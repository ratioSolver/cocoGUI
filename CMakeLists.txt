cmake_minimum_required(VERSION 3.5.0)
project(CoCoGUI VERSION 0.2.0 LANGUAGES CXX)
set(CMAKE_CXX_FLAGS_DEBUG "${CMAKE_CXX_FLAGS_DEBUG} -fsanitize=undefined")

include(CTest)
enable_testing()

set(CLIENT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/client CACHE STRING "Client directory" FORCE)

execute_process(COMMAND npm install WORKING_DIRECTORY ${CLIENT_DIRECTORY})
execute_process(COMMAND npm run build WORKING_DIRECTORY ${CLIENT_DIRECTORY})

add_subdirectory(extern/coco)
add_subdirectory(extern/rationet)

add_executable(CoCoGUI src/coco_main.cpp src/coco_server.cpp)
add_dependencies(CoCoGUI CoCo ratioNet)
target_link_libraries(CoCoGUI PUBLIC CoCo ratioNet)
target_include_directories(CoCoGUI PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include> ${CLIPS_INCLUDE_DIR} ${LIBMONGOCXX_INCLUDE_DIR} ${LIBBSONCXX_INCLUDE_DIR})

add_executable(oRatioGUI src/ratio_main.cpp src/coco_server.cpp)
add_dependencies(oRatioGUI oRatioLib ratioNet)
target_link_libraries(oRatioGUI PUBLIC CoCo ratioNet)
target_include_directories(oRatioGUI PUBLIC $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include> ${CLIPS_INCLUDE_DIR} ${LIBMONGOCXX_INCLUDE_DIR} ${LIBBSONCXX_INCLUDE_DIR})

if(MSVC)
    target_compile_options(CoCoGUI PRIVATE /W4)
else()
    target_compile_options(CoCoGUI PRIVATE -Wall -Wextra -Wpedantic)
    if (ENABLE_COVERAGE)
        if (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
            target_compile_options(CoCoGUI PRIVATE --coverage)
            target_link_libraries(CoCoGUI PUBLIC gcov)
        endif()
    endif()
endif()

set(CPACK_PROJECT_NAME CoCoGUI)
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
