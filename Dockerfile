# Use a base image with Ubuntu
FROM ubuntu:latest AS coco_base

# Install the necessary dependencies
RUN apt update && apt install -y build-essential cmake libssl-dev unzip wget curl git python3

# Compile and install CLIPS
RUN wget -O /tmp/clips.zip https://sourceforge.net/projects/clipsrules/files/CLIPS/6.4.1/clips_core_source_641.zip/download
RUN unzip /tmp/clips.zip -d /tmp
WORKDIR /tmp/clips_core_source_641/core
RUN make release_cpp
RUN mkdir -p /usr/local/include/clips
RUN cp *.h /usr/local/include/clips
RUN cp libclips.a /usr/local/lib

# Compile and install the mongo-cxx driver
WORKDIR /tmp
RUN curl -OL https://github.com/mongodb/mongo-cxx-driver/releases/download/r3.10.1/mongo-cxx-driver-r3.10.1.tar.gz
RUN tar -xzf mongo-cxx-driver-r3.10.1.tar.gz
WORKDIR /tmp/mongo-cxx-driver-r3.10.1/build
RUN cmake .. -DCMAKE_BUILD_TYPE=Release -DMONGOCXX_OVERRIDE_DEFAULT_INSTALL_PREFIX=OFF
RUN cmake --build .
RUN cmake --build . --target install

# Clean up
RUN rm -rf /tmp/*

# Use a base image with CLIPS and MongoDB C++ driver
FROM coco_base AS coco

# Expose the port that CoCo uses to run
EXPOSE 8080

# Set the environment variables
ARG CLIENT_DIR=coco-client

# Install CoCo
WORKDIR /home
RUN git clone -b memory --recursive https://github.com/ratioSolver/cocoGUI

# Build CoCo Backend
WORKDIR /home/cocoGUI
RUN mkdir build && cd build && cmake -DCLIENT_DIR=${CLIENT_DIR} .. && make

# Install Node.js through NVM
WORKDIR /tmp
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
SHELL ["/bin/bash", "-c"]
RUN source ~/.nvm/nvm.sh && nvm install node && nvm alias default node

# Build CoCo Frontend
WORKDIR /home/cocoGUI/coco-client
RUN source ~/.nvm/nvm.sh && npm install
RUN source ~/.nvm/nvm.sh && npm run build

# Clean up
RUN rm -rf /tmp/*

# Run CoCo
CMD /home/cocoGUI/build/CoCoGUI