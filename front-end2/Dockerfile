# Dockerfile
FROM node:20

# Set working directory
WORKDIR /app



RUN npm install -g vite



# Install dependencies (only the package files to leverage Docker cache)
COPY package*.json ./

RUN npm install
RUN npm install zustand lucide-react cytoscape-fcose cytoscape-cola cytoscape-dagre xml2js dompurify cytoscape-elk

# Copy app files
COPY . .

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "dev"]
