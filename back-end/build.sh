#!/bin/bash

# D&D 5e Backend Build Script
set -e

echo "🏗️  Building D&D 5e Backend Server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "CMakeLists.txt" ]; then
    print_error "CMakeLists.txt not found. Please run this script from the back-end directory."
    exit 1
fi

# Check for required tools
print_status "Checking build dependencies..."

check_dependency() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed. Please install it first."
        exit 1
    fi
}

check_dependency "cmake"
check_dependency "make"
check_dependency "g++"

# Check for optional dependencies
if ! pkg-config --exists protobuf; then
    print_warning "protobuf not found. Installing dependencies..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y build-essential cmake pkg-config \
            libprotobuf-dev protobuf-compiler libgrpc++-dev \
            protobuf-compiler-grpc libcurl4-openssl-dev \
            nlohmann-json3-dev
    else
        print_error "Please install protobuf and gRPC dependencies manually."
        exit 1
    fi
fi

# Clean previous build
if [ -d "build" ]; then
    print_status "Cleaning previous build..."
    rm -rf build
fi

# Create build directory
print_status "Creating build directory..."
mkdir -p build
cd build

# Configure with CMake
print_status "Configuring with CMake..."
cmake .. -DCMAKE_BUILD_TYPE=Release \
         -DCMAKE_EXPORT_COMPILE_COMMANDS=ON \
         -DCMAKE_INSTALL_PREFIX=/usr/local

# Build the project
print_status "Building the project..."
make -j$(nproc)

# Check if build was successful
if [ -f "dnd5e-backend" ]; then
    print_success "Build completed successfully!"
    
    # Show build info
    echo ""
    print_status "Build Information:"
    echo "  Binary: $(pwd)/dnd5e-backend"
    echo "  Size: $(du -h dnd5e-backend | cut -f1)"
    echo "  Architecture: $(file dnd5e-backend | cut -d: -f2)"
    
    # Test the binary
    print_status "Testing the binary..."
    if ./dnd5e-backend --test; then
        print_success "Binary test passed!"
    else
        print_warning "Binary test failed, but build was successful."
    fi
    
    echo ""
    print_success "🎉 D&D 5e Backend is ready!"
    echo ""
    echo "To run the server:"
    echo "  ./dnd5e-backend --address 0.0.0.0:50051"
    echo ""
    echo "To install system-wide:"
    echo "  sudo make install"
    echo ""
    echo "To run tests:"
    echo "  ctest --output-on-failure"
    
else
    print_error "Build failed! Binary not found."
    exit 1
fi

