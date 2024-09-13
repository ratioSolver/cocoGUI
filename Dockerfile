FROM pstlab/coco_base

# Expose the port that CoCo uses to run
EXPOSE 8080

# Set the environment variables
ARG MONGODB_HOST=coco-db
ARG MONGODB_PORT=27017
ARG TRANSFORMER_HOST=coco-rasa
ARG CLIENT_FOLDER=coco-client

# Install NVM and Node.js
WORKDIR /home
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
SHELL ["/bin/bash", "-c"]
RUN source ~/.nvm/nvm.sh && nvm install node && nvm alias default node

# Install CoCo
WORKDIR /home
RUN git clone -b memory --recursive https://github.com/ratioSolver/cocoGUI

# Build CoCo Backend
WORKDIR /home/cocoGUI
RUN mkdir build && cd build && cmake -DMONGODB_HOST=${MONGODB_HOST} -DMONGODB_PORT=${MONGODB_PORT} -DTRANSFORMER_HOST=${TRANSFORMER_HOST} -DCLIENT_FOLDER=${CLIENT_FOLDER} .. && make

# Build CoCo Frontend
WORKDIR /home/cocoGUI/coco-client
RUN source ~/.nvm/nvm.sh && npm install && npm run build

WORKDIR /home/cocoGUI
CMD /home/cocoGUI/build/AgeIt