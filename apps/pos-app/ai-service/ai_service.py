#!/usr/bin/env python3
"""
海邻到家 - AI 视觉识别服务
用于称重收银一体机的本地 AI 推理

依赖安装:
    pip install ultralytics flask opencv-python numpy pyserial

运行:
    python ai_service.py

作者: 海邻到家技术团队
版本: 1.0.0
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import json
import time
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允许跨域访问

# ============ 配置区 ============
# 模型路径（相对于当前文件）
MODEL_PATH = Path(__file__).parent / "best.pt"
CONFIDENCE_THRESHOLD = 0.85
DEFAULT_PORT = 5000

# 商品名称映射表（可根据需要扩展）
PRODUCT_NAME_MAP = {
    'apple': '红富士苹果',
    'red_apple': '红富士苹果',
    'banana': '香蕉',
    'orange': '橙子',
    'bread': '面包',
    'milk': '纯牛奶',
    'yogurt': '酸奶',
}

# 全局模型（延迟加载）
_model = None

def load_model():
    """加载 YOLOv8 模型"""
    global _model
    if _model is None:
        try:
            from ultralytics import YOLO
            logger.info(f"正在加载模型: {MODEL_PATH}")
            _model = YOLO(str(MODEL_PATH))
            logger.info("模型加载成功!")
        except Exception as e:
            logger.error(f"模型加载失败: {e}")
            # 返回一个 Mock 模型用于开发测试
            logger.warning("使用 Mock 模型（开发测试用）")
            _model = "mock"
    return _model

def decode_image(base64_str: str) -> np.ndarray:
    """将 Base64 图片转换为 OpenCV 格式"""
    # 去除头部信息
    if ',' in base64_str:
        base64_str = base64_str.split(',')[1]
    
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

def translate_product_name(name: str) -> str:
    """翻译商品名称为中文"""
    name_lower = name.lower()
    return PRODUCT_NAME_MAP.get(name_lower, name)

def mock_recognize() -> list:
    """Mock 识别结果（开发测试用）"""
    import random
    products = [
        ('红富士苹果', 0.95),
        ('黄元帅苹果', 0.72),
        ('香蕉', 0.88),
        ('面包', 0.82),
    ]
    return [{'name': p[0], 'confidence': p[1]} for p in random.sample(products, 2)]

# ============ API 路由 ============

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'service': 'ai-recognition',
        'version': '1.0.0',
        'timestamp': time.time()
    })

@app.route('/recognize', methods=['POST'])
def recognize():
    """
    商品识别接口
    
    请求体:
    {
        "image": "base64编码的图片数据（不含 data:image/... 前缀）"
    }
    
    返回:
    {
        "status": "success" | "failed",
        "product": "商品名称",
        "all_detected": [{"name": "名称", "confidence": 0.95}, ...],
        "message": "提示信息"
    }
    """
    try:
        # 1. 接收图片数据
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({
                'status': 'failed',
                'error': '缺少 image 参数'
            }), 400

        image_b64 = data.get('image')
        
        # 2. 解码图片
        img = decode_image(image_b64)
        if img is None:
            return jsonify({
                'status': 'failed',
                'error': '图片解码失败'
            }), 400

        # 3. 进行推理
        model = load_model()
        
        if model == "mock":
            # Mock 模式（开发测试）
            detected_items = mock_recognize()
            logger.info("使用 Mock 识别结果")
        else:
            # 真实 YOLOv8 推理
            results = model(img, verbose=False, conf=CONFIDENCE_THRESHOLD)
            
            detected_items = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    conf = float(box.conf[0].cpu().numpy())
                    cls_id = int(box.cls[0].cpu().numpy())
                    cls_name = result.names[cls_id]
                    
                    if conf >= CONFIDENCE_THRESHOLD:
                        detected_items.append({
                            'name': translate_product_name(cls_name),
                            'confidence': conf
                        })

        # 4. 返回结果
        if detected_items:
            # 按置信度排序
            detected_items.sort(key=lambda x: x['confidence'], reverse=True)
            
            return jsonify({
                'status': 'success',
                'product': detected_items[0]['name'],
                'confidence': detected_items[0]['confidence'],
                'all_detected': detected_items
            })
        else:
            return jsonify({
                'status': 'failed',
                'message': '未识别到商品，请确保商品在摄像头范围内'
            })

    except Exception as e:
        logger.error(f"识别出错: {e}")
        return jsonify({
            'status': 'failed',
            'error': str(e)
        }), 500

@app.route('/recognize-with-weight', methods=['POST'])
def recognize_with_weight():
    """
    带重量的识别接口（用于称重一体机）
    
    请求体:
    {
        "image": "base64图片",
        "weight": 1.25,  // 重量(kg)
        "unit": "kg"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'failed', 'error': '无效请求'}), 400

        # 调用标准识别
        recognize_result = recognize()
        result_data = json.loads(recognize_result.data)
        
        # 添加重量信息
        weight = data.get('weight', 0)
        result_data['weight'] = weight
        result_data['unit'] = data.get('unit', 'kg')
        
        if result_data.get('status') == 'success':
            # 计算预估总价（需要对接商品价格表）
            result_data['estimated_price'] = None  # 可扩展
        
        return jsonify(result_data)

    except Exception as e:
        return jsonify({'status': 'failed', 'error': str(e)}), 500

@app.route('/config', methods=['GET', 'POST'])
def config():
    """配置接口"""
    if request.method == 'GET':
        return jsonify({
            'confidence_threshold': CONFIDENCE_THRESHOLD,
            'model_path': str(MODEL_PATH),
            'model_loaded': _model is not None,
            'product_map': PRODUCT_NAME_MAP
        })
    else:
        # 更新配置（谨慎使用）
        data = request.get_json()
        global CONFIDENCE_THRESHOLD
        if 'confidence_threshold' in data:
            CONFIDENCE_THRESHOLD = float(data['confidence_threshold'])
        return jsonify({'status': 'ok', 'new_threshold': CONFIDENCE_THRESHOLD})

@app.route('/products', methods=['GET'])
def list_products():
    """获取支持识别的商品列表"""
    return jsonify({
        'products': [
            {'id': 'apple', 'name': '苹果', 'category': '生鲜'},
            {'id': 'banana', 'name': '香蕉', 'category': '生鲜'},
            {'id': 'bread', 'name': '面包', 'category': '烘焙'},
        ]
    })

# ============ 主程序 ============

def main():
    """启动服务"""
    # 预加载模型
    logger.info("正在初始化 AI 服务...")
    load_model()
    
    logger.info(f"""
╔═══════════════════════════════════════════════════╗
║         海邻到家 AI 视觉识别服务                    ║
╠═══════════════════════════════════════════════════╣
║  服务地址: http://0.0.0.0:{DEFAULT_PORT}                       ║
║  健康检查: http://127.0.0.1:{DEFAULT_PORT}/health              ║
║  识别接口: http://127.0.0.1:{DEFAULT_PORT}/recognize            ║
╠═══════════════════════════════════════════════════╣
║  置信度阈值: {CONFIDENCE_THRESHOLD}                                 ║
║  模型路径: {MODEL_PATH}                       ║
╚═══════════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=DEFAULT_PORT,
        debug=False,
        threaded=True
    )

if __name__ == '__main__':
    main()
