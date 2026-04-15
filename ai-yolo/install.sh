#!/bin/bash
# 海邻到家 - YOLOv8 安装脚本

set -e

echo "========================================"
echo "海邻到家 - YOLOv8 安装脚本"
echo "========================================"
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "错误: 需要 Python 3.8+"
    echo "请先安装 Python: https://www.python.org/downloads/"
    exit 1
fi

echo "Python 版本: $(python3 --version)"

# 检查 pip
if ! command -v pip3 &> /dev/null; then
    echo "错误: 需要 pip3"
    exit 1
fi

echo ""
echo "[1/3] 创建虚拟环境..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

echo ""
echo "[2/3] 安装依赖..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "[3/3] 创建目录..."
mkdir -p models
mkdir -p dataset/images/train
mkdir -p dataset/images/val
mkdir -p dataset/labels/train
mkdir -p dataset/labels/val
mkdir -p test_images
mkdir -p runs

echo ""
echo "========================================"
echo "✓ 安装完成！"
echo "========================================"
echo ""
echo "下一步:"
echo ""
echo "1. 激活虚拟环境:"
echo "   source venv/bin/activate"
echo ""
echo "2. 快速开始（使用预训练模型）:"
echo "   python quick_create_model.py"
echo "   python yolo_api_server.py"
echo ""
echo "3. 训练自定义模型:"
echo "   python train_yolo.py --prepare"
echo "   # 添加训练数据后"
echo "   python train_yolo.py --train"
echo ""
echo "========================================"
