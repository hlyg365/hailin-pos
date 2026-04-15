#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - YOLOv8 API 服务

提供商品识别的 HTTP API 接口

启动：
    python yolo_api_server.py [--port PORT] [--model MODEL_PATH]

API 文档：
    http://localhost:8000/docs
"""

import io
import os
import sys
import json
import base64
import argparse
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any

import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 全局变量
yolo_model = None
model_path = None
model_loaded = False

# 商品价格映射表（单位：分）
PRODUCT_PRICE_MAP: Dict[str, int] = {
    'apple': 300,      # 苹果 3.00元
    'banana': 200,     # 香蕉 2.00元
    'orange': 250,     # 橙子 2.50元
    'broccoli': 580,   # 西兰花 5.80元
    'carrot': 320,     # 胡萝卜 3.20元
    'milk': 500,       # 牛奶 5.00元
    'bread': 680,      # 面包 6.80元
    'cola': 300,       # 可乐 3.00元
    'water': 200,      # 矿泉水 2.00元
    'coffee': 1280,    # 咖啡 12.80元
    'cookie': 880,     # 饼干 8.80元
    'chocolate': 1580, # 巧克力 15.80元
}

# 商品名称映射
PRODUCT_NAME_MAP: Dict[str, str] = {
    'apple': '苹果',
    'banana': '香蕉',
    'orange': '橙子',
    'broccoli': '西兰花',
    'carrot': '胡萝卜',
    'milk': '纯牛奶',
    'bread': '吐司面包',
    'cola': '可口可乐',
    'water': '矿泉水',
    'coffee': '拿铁咖啡',
    'cookie': '曲奇饼干',
    'chocolate': '德芙巧克力',
}

def load_model(model_path: str = 'models/yolov8n-products.pt') -> bool:
    """加载 YOLOv8 模型"""
    global yolo_model, model_loaded, model_path
    
    try:
        from ultralytics import YOLO
        
        # 检查模型文件是否存在
        if not os.path.exists(model_path):
            logger.warning(f"模型文件不存在: {model_path}")
            logger.info("使用预训练 YOLOv8n 模型")
            model_path = 'yolov8n.pt'
        
        logger.info(f"正在加载模型: {model_path}")
        yolo_model = YOLO(model_path)
        model_loaded = True
        logger.info("✓ 模型加载成功")
        return True
        
    except ImportError:
        logger.error("未安装 ultralytics")
        return False
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        return False

def recognize_image(image_data: bytes, confidence: float = 0.5) -> Dict[str, Any]:
    """
    识别图片中的商品
    
    Args:
        image_data: 图片二进制数据
        confidence: 置信度阈值
    
    Returns:
        识别结果
    """
    global yolo_model
    
    start_time = datetime.now()
    
    try:
        # 解码图片
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                'success': False,
                'error': '无法解析图片数据',
                'products': [],
                'total_price': 0
            }
        
        # 如果模型未加载，返回错误
        if yolo_model is None:
            return {
                'success': False,
                'error': '模型未加载',
                'products': [],
                'total_price': 0
            }
        
        # 执行推理
        results = yolo_model(img, conf=confidence)
        
        # 解析结果
        detected_products = []
        seen_labels = set()
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                label = result.names[cls_id]
                
                # 避免重复计数
                if label not in seen_labels:
                    seen_labels.add(label)
                    
                    conf = float(box.conf[0])
                    
                    detected_products.append({
                        'label': label,
                        'name': PRODUCT_NAME_MAP.get(label, label),
                        'confidence': round(conf, 3),
                        'price': PRODUCT_PRICE_MAP.get(label, 0),
                        'category': 'unknown'
                    })
        
        # 计算总价
        total_price = sum(p['price'] for p in detected_products)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return {
            'success': True,
            'count': len(detected_products),
            'products': detected_products,
            'total_price': total_price,
            'processing_time': round(processing_time, 3),
            'model': model_path or 'yolov8n'
        }
        
    except Exception as e:
        logger.error(f"识别失败: {e}")
        return {
            'success': False,
            'error': str(e),
            'products': [],
            'total_price': 0
        }

def recognize_with_weight(image_data: bytes, weight: float, confidence: float = 0.5) -> Dict[str, Any]:
    """
    带重量的商品识别
    
    用于称重商品（如水果、蔬菜）的自动计价
    
    Args:
        image_data: 图片二进制数据
        weight: 重量（kg）
        confidence: 置信度阈值
    
    Returns:
        识别结果
    """
    # 先执行普通识别
    result = recognize_image(image_data, confidence)
    
    if not result['success']:
        return result
    
    # 计算称重商品的价格
    weight_price_per_kg = 1298  # 默认 12.98 元/斤
    
    for product in result['products']:
        # 称重商品：按重量 * 单价计算
        product['weight'] = weight
        product['is_weighted'] = True
        product['unit_price'] = weight_price_per_kg  # 分/斤
        product['line_total'] = round(weight * 500 * weight_price_per_kg / 100)  # 转换为元
    
    # 重新计算总价
    result['total_price'] = sum(p['line_total'] for p in result['products'])
    result['weight'] = weight
    
    return result

# ============== API 路由 ==============

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'service': 'yolo-recognition',
        'model_loaded': model_loaded,
        'model': model_path,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/products', methods=['GET'])
def get_products():
    """获取支持的商品列表"""
    products = []
    for label, name in PRODUCT_NAME_MAP.items():
        products.append({
            'label': label,
            'name': name,
            'price': PRODUCT_PRICE_MAP.get(label, 0)
        })
    
    return jsonify({
        'success': True,
        'count': len(products),
        'products': products
    })

@app.route('/api/recognize', methods=['POST'])
def recognize():
    """
    图片识别接口
    
    支持格式：
    - multipart/form-data: image 文件
    - application/json: { "image": "base64..." }
    """
    confidence = float(request.form.get('confidence', 0.5))
    
    image_data = None
    
    # 方式1: 文件上传
    if 'image' in request.files:
        file = request.files['image']
        image_data = file.read()
    # 方式2: Base64 编码
    elif request.is_json and 'image' in request.json:
        try:
            image_data = base64.b64decode(request.json['image'])
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Base64 解码失败: {e}'
            }), 400
    else:
        return jsonify({
            'success': False,
            'error': '请提供图片数据'
        }), 400
    
    result = recognize_image(image_data, confidence)
    return jsonify(result)

@app.route('/api/recognize/base64', methods=['POST'])
def recognize_base64():
    """
    Base64 图片识别接口
    
    用于收银台 APP 调用
    
    请求：
    {
        "image": "base64编码的图片",
        "confidence": 0.5
    }
    """
    data = request.get_json()
    
    if not data or 'image' not in data:
        return jsonify({
            'success': False,
            'error': '请提供图片数据'
        }), 400
    
    try:
        image_data = base64.b64decode(data['image'])
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Base64 解码失败: {e}'
        }), 400
    
    confidence = data.get('confidence', 0.5)
    
    result = recognize_image(image_data, confidence)
    return jsonify(result)

@app.route('/api/recognize/weight', methods=['POST'])
def recognize_with_weight_api():
    """
    带重量的识别接口
    
    请求：
    {
        "image": "base64编码的图片",
        "weight": 0.5,
        "confidence": 0.5
    }
    """
    data = request.get_json()
    
    if not data or 'image' not in data:
        return jsonify({
            'success': False,
            'error': '请提供图片数据'
        }), 400
    
    try:
        image_data = base64.b64decode(data['image'])
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Base64 解码失败: {e}'
        }), 400
    
    weight = data.get('weight', 0)
    confidence = data.get('confidence', 0.5)
    
    result = recognize_with_weight(image_data, weight, confidence)
    return jsonify(result)

@app.route('/api/price/update', methods=['POST'])
def update_price():
    """
    更新商品价格
    
    请求：
    {
        "label": "apple",
        "price": 350
    }
    """
    data = request.get_json()
    
    if not data or 'label' not in data or 'price' not in data:
        return jsonify({
            'success': False,
            'error': '请提供商品标签和价格'
        }), 400
    
    label = data['label']
    price = int(data['price'])
    
    PRODUCT_PRICE_MAP[label] = price
    
    return jsonify({
        'success': True,
        'message': f'商品 {label} 价格已更新为 {price}'
    })

def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='海邻到家 YOLOv8 API 服务')
    parser.add_argument('--host', default='0.0.0.0', help='监听地址')
    parser.add_argument('--port', type=int, default=8000, help='监听端口')
    parser.add_argument('--model', default='models/yolov8n-products.pt', help='模型路径')
    return parser.parse_args()

def main():
    """主入口"""
    global model_path
    
    args = parse_arguments()
    model_path = args.model
    
    print("=" * 60)
    print("海邻到家 - YOLOv8 商品识别 API 服务")
    print("=" * 60)
    print()
    
    # 加载模型
    load_model(model_path)
    
    # 启动服务
    print(f"启动服务: http://{args.host}:{args.port}")
    print(f"API 文档: http://{args.host}:{args.port}/docs")
    print()
    print("按 Ctrl+C 停止服务")
    print("=" * 60)
    
    app.run(
        host=args.host,
        port=args.port,
        debug=False,
        threaded=True
    )

if __name__ == '__main__':
    main()
