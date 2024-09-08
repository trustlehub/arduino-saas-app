FROM node:lts-alpine

ARG NEXT_PUBLIC_BACKEND_BASEURL
ENV NEXT_PUBLIC_BACKEND_BASEURL $NEXT_PUBLIC_BACKEND_BASEURL 

# Set working directory
WORKDIR /app

# Copy app and install dependencies
COPY . .

RUN npm install

# Build the React app
RUN npm run build

# Serve the React app using a simple web server
RUN npm install -g serve
CMD ["npm", "start"]

# Expose port 3000
EXPOSE 3000
