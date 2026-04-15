#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - AI 商品识别服务

基于 YOLOv8 的商品识别 API 服务

启动：
    python ai_service.py [--host HOST] [--port PORT] [--model MODEL]

示例：
    python ai_service.py --port 5000
    python ai_service.py --host 0.0.0.0 --port 5000
"""

import io
import os
import sys
import json
import base64
import argparse
import logging
from datetime import datetime
from typing import Optional, Dict, List, Any

from flask import Flask, request, jsonify
import numpy as np

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 全局变量
yolo_model = None
model_loaded = False

# 商品价格映射表（单位：分）
PRODUCT_PRICE_MAP: Dict[str, int] = {
    'apple': 300,      # 苹果 3.00元
    'banana': 200,     # 香蕉 2.00元
    'orange': 250,     # 橙子 2.50元
    'milk': 500,       # 牛奶 5.00元
    'bread': 680,      # 面包 6.80元
    'cola': 300,       # 可乐 3.00元
    'water': 200,      # 矿泉水 2.00元
    'coffee': 1280,    # 咖啡 12.80元
    'cookie': 880,     # 饼干 8.80元
    'chocolate': 1580, # 巧克力 15.80元
}

# 商品名称映射（中英文）
PRODUCT_NAME_MAP: Dict[str, str] = {
    'apple': '苹果',
    'banana': '香蕉',
    'orange': '橙子',
    'milk': '纯牛奶',
    'bread': '吐司面包',
    'cola': '可口可乐',
    'water': '矿泉水',
    'coffee': '拿铁咖啡',
    'cookie': '曲奇饼干',
    'chocolate': '德芙巧克力',
}

def load_yolo_model(model_path: str = 'yolov8n.pt') -> Optional[Any]:
    """加载 YOLOv8 模型"""
    global yolo_model, model_loaded
    
    try:
        from ultralytics import YOLO
        logger.info(f"正在加载 YOLOv8 模型: {model_path}")
        yolo_model = YOLO(model_path)
        model_loaded = True
        logger.info("模型加载成功")
        return yolo_model
    except ImportError:
        logger.warning("未安装 ultralytics，将使用模拟模式")
        model_loaded = False
        return None
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        model_loaded = False
        return None

def recognize_from_image(image_data: bytes, confidence: float = 0.75) -> Dict[str, Any]:
    """
    从图片识别商品
    
    Args:
        image_data: 图片二进制数据
        confidence: 置信度阈值
    
    Returns:
        识别结果字典
    """
    global yolo_model, model_loaded
    
    start_time = datetime.now()
    
    # 如果模型未加载，使用模拟模式
    if not model_loaded or yolo_model is None:
        return simulate_recognition(image_data, confidence)
    
    try:
        # 将图片数据转换为 numpy 数组
        import cv2
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {
                'success': False,
                'error': '无法解析图片数据',
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
                label = result.names[int(box.cls[0])]
                
                # 避免重复计数
                if label not in seen_labels:
                    seen_labels.add(label)
                    
                    conf = float(box.conf[0])
                    
                    detected_products.append({
                        'label': label,
                        'name': PRODUCT_NAME_MAP.get(label, label),
                        'confidence': round(conf, 3),
                        'price': PRODUCT_PRICE_MAP.get(label, 0)
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
            'model': 'yolov8'
        }
        
    except Exception as e:
        logger.error(f"识别失败: {e}")
        return {
            'success': False,
            'error': str(e),
            'products': [],
            'total_price': 0
        }

def simulate_recognition(image_data: bytes, confidence: float = 0.75) -> Dict[str, Any]:
    """
    模拟识别（用于开发测试）
    
    Args:
        image_data: 图片数据（未使用）
        confidence: 置信度阈值
    
    Returns:
        模拟识别结果
    """
    import random
    
    # 随机选择1-3个商品
    num_products = random.randint(1, 3)
    labels = random.sample(list(PRODUCT_PRICE_MAP.keys()), min(num_products, len(PRODUCT_PRICE_MAP)))
    
    detected_products = []
    for label in labels:
        detected_products.append({
            'label': label,
            'name': PRODUCT_NAME_MAP.get(label, label),
            'confidence': round(random.uniform(confidence, 0.99), 3),
            'price': PRODUCT_PRICE_MAP.get(label, 0)
        })
    
    total_price = sum(p['price'] for p in detected_products)
    
    return {
        'success': True,
        'count': len(detected_products),
        'products': detected_products,
        'total_price': total_price,
        'processing_time': 0.05,
        'model': 'simulated'
    }

# ============== Flask 路由 ==============

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'healthy',
        'service': 'ai-recognition',
        'model_loaded': model_loaded,
        'model_type': 'yolov8' if model_loaded else 'simulated',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/products', methods=['GET'])
def get_products():
    """获取支持识别的商品列表"""
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

@app.route('/recognize', methods=['POST'])
def recognize():
    """
    图片识别接口
    
    支持两种数据格式：
    1. multipart/form-data: image 文件
    2. application/json: { "image": "base64编码的图片数据" }
    """
    try:
        confidence = float(request.form.get('confidence', 0.75))
    except ValueError:
        confidence = 0.75
    
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
            'error': '请提供图片数据（文件上传或Base64编码）'
        }), 400
    
    result = recognize_from_image(image_data, confidence)
    
    return jsonify(result)

@app.route('/recognize_with_weight', methods=['POST'])
def recognize_with_weight():
    """
    带重量的识别接口
    
    用于称重商品（如水果、蔬菜）的自动计价
    
    请求格式：
    {
        "image": "base64编码的图片数据",
        "weight": 0.5,  // 重量（千克）
        "confidence": 0.75
    }
    """
    try:
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
        
        weight = data.get('weight', 0)  # 单位：千克
        confidence = data.get('confidence', 0.75)
        
        # 执行识别
        result = recognize_from_image(image_data, confidence)
        
        if result['success']:
            # 计算称重商品的价格
            # 假设识别出的商品都是按重量计价的
            weight_price_per_kg = 1000  # 默认 10.00 元/斤
            
            for product in result['products']:
                # 称重商品：按重量 * 单价计算
                product['weight'] = weight
                product['is_weighted'] = True
                
                # 根据商品类型设置单价（模拟）
                if product['label'] in ['apple', 'banana', 'orange']:
                    product['unit_price'] = 1298  # 12.98 元/斤
                else:
                    product['unit_price'] = weight_price_per_kg
                
                product['line_total'] = round(weight * product['unit_price'])
            
            # 重新计算总价
            result['total_price'] = sum(p['line_total'] for p in result['products'])
            result['weight'] = weight
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"识别失败: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def parse_arguments():
    """解析命令行参数"""
    parser = argparse.ArgumentParser(description='海邻到家 AI 商品识别服务')
    parser.add_argument('--host', default='0.0.0.0', help='监听地址')
    parser.add_argument('--port', type=int, default=5000, help='监听端口')
    parser.add_argument('--model', default='yolov8n.pt', help='YOLOv8 模型路径')
    return parser.parse_args()

def main():
    """主入口"""
    args = parse_arguments()
    
    logger.info("=" * 50)
    logger.info("海邻到家 - AI 商品识别服务")
    logger.info("=" * 50)
    
    # 加载模型
    load_yolo_model(args.model)
    
    # 启动服务
    logger.info(f"启动服务: {args.host}:{args.port}")
    logger.info("按 Ctrl+C 停止服务")
    
    app.run(
        host=args.host,
        port=args.port,
        debug=False,
        threaded=True
    )

if __name__ == '__main__':
    main()
