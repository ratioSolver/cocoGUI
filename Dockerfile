FROM pstlab/coco_base

# Expose the port that Age-It uses to run
EXPOSE 8080

# Set the environment variables
ARG MONGODB_HOST=coco-db
ARG MONGODB_PORT=27017
ARG TRANSFORMER_HOST=coco-rasa
ARG CLIENT_FOLDER=coco-client

# Install NVM and Node.js
WORKDIR /home
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
SHELL ["/bin/bash", "-c"]
RUN source ~/.nvm/nvm.sh && nvm install node && nvm alias default node

# Install Age-It
WORKDIR /home
RUN git clone --recursive https://github.com/pstlab/Age-It

# Build Age-It Backend
WORKDIR /home/Age-It
RUN mkdir build && cd build && cmake -DMONGODB_HOST=${MONGODB_HOST} -DMONGODB_PORT=${MONGODB_PORT} -DTRANSFORMER_HOST=${TRANSFORMER_HOST} -DCLIENT_FOLDER=${CLIENT_FOLDER} .. && make

# Build Age-It Frontend
WORKDIR /home/Age-It/client
RUN source ~/.nvm/nvm.sh && npm install && npm run build

RUN mkdir /coco

WORKDIR /home/Age-It
CMD /home/Age-It/build/AgeIt