# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=16.16.0
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NestJS/Prisma"

# NestJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="development"
ARG YARN_VERSION=1.22.21
RUN npm install -g yarn@$YARN_VERSION --force


# Throw-away build stage to reduce size of final image
FROM base as build

# RUN yarn cache clean
# RUN yarn install --force
# RUN yarn upgrade

# remove node modules folder
# RUN rm -rf node_modules

# RUN yarn add @types/ejs@^3.0.3 @types/pug@2.0.6 ejs@^3.1.2 nodemailer@^6.4.6 pug@^3.0.1 express@^4.0.0 webpack@^5.0.0

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python

# Install node modules
COPY --link package.json yarn.lock ./
# RUN yarn upgrade bcrypt string-width

# RUN yarn install --force --frozen-lockfile --production=false

# Generate Prisma Client
COPY --link ./src/common/prisma/schema.prisma .
RUN npx prisma generate

COPY --link ./src/common/prisma/schema.prisma ./src/common/prisma/schema.prisma
RUN yarn db.generate

# RUN yarn upgrade @prisma/client
# RUN yarn upgrade prisma


# Copy application code
COPY --link . .

# Build application
RUN yarn run build

# Run migrations
# COPY --link ./src/common/prisma/schema.prisma .
# RUN yarn run db.migration.run

# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "yarn", "run", "start" ]
