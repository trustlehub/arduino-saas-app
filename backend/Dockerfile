FROM python:3.12-alpine

# Set working directory
WORKDIR /app

# Copy requirements file and install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# install arduino-cli. Arduino-cli setup
RUN apk --no-cache add curl
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/bin sh
RUN apk add libc6-compat
RUN arduino-cli core install arduino:avr
# Copy the rest of the application
COPY . .

# Command to run the FastAPI server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
# Expose port 8000
EXPOSE 8000
