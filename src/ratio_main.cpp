#include <thread>
#include <fstream>
#include <mongocxx/instance.hpp>
#include "coco_server.hpp"
#include "logging.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    if (argc < 3)
    {
        LOG_FATAL("usage: oRatio <input-file> [<input-file> ...] <output-file>");
        return -1;
    }

    // the problem files..
    std::vector<std::string> prob_names;
    for (int i = 1; i < argc - 1; i++)
        prob_names.push_back(argv[i]);

    // the solution file..
    std::string sol_name = argv[argc - 1];

    LOG_INFO("starting oRatio server");

    mongocxx::instance inst{}; // This should be done only once.

    coco::coco_server server;
    auto srv_ft = std::async(std::launch::async, [&server]
                             { server.server::start(); });

    std::this_thread::sleep_for(std::chrono::milliseconds(500));

    auto &exec = server.create_solver("oRatio");
    exec.adapt(prob_names);
    exec.ratio::executor::executor::tick();

    return 0;
}
