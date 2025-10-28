# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:22.1.0 AS dependencies

LABEL maintainer="Mohammed Shaikh <msshaikh10@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# Reduce npm spam when installing within Docker
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy the package.json and package-lock.json files first for layer caching
COPY package.json package-lock.json ./

# Install node dependencies defined in package-lock.json
RUN npm install

# Stage 2: Production image using Alpine
FROM node:22.1.0-alpine AS production

LABEL maintainer="Mohammed Shaikh <msshaikh10@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Use /app as our working directory
WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./test/.htpasswd ./test/.htpasswd

# We run our service on port 8080
EXPOSE 8080

# Start the container by running our server
CMD npm start
