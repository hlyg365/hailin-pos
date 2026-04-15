#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
海邻到家 - YOLOv8 快速创建预训练模型

快速生成一个基于预训练 YOLOv8 的商品识别模型
无需训练数据，适合快速测试

使用方法：
    python quick_create_model.py
"""

import os
import sys
from pathlib import Path

def main():
    print("=" * 60)
    print("海邻到家 - YOLOv8 快速创建模型")
    print("=" * 60)
    print()
    
    # 1. 检查依赖
    print("[1/4] 检查依赖...")
    try:
        from ultralytics import YOLO
        import cv2
        import numpy as np
        print("✓ 依赖检查通过")
    except ImportError as e:
        print(f"✗ 缺少依赖: {e}")
        print()
        print("请先安装依赖：")
        print("    pip install -r requirements.txt")
        sys.exit(1)
    
    # 2. 创建输出目录
    print("\n[2/4] 创建目录...")
    project_dir = Path(__file__).parent
    models_dir = project_dir / "models"
    models_dir.mkdir(exist_ok=True)
    
    test_images_dir = project_dir / "test_images"
    test_images_dir.mkdir(exist_ok=True)
    print(f"✓ 模型目录: {models_dir}")
    print(f"✓ 测试图片目录: {test_images_dir}")
    
    # 3. 下载并准备模型
    print("\n[3/4] 准备 YOLOv8 模型...")
    try:
        # 使用 YOLOv8n（最小最快的模型）
        print("  - 下载 YOLOv8n 模型...")
        model = YOLO('yolov8n.pt')
        
        # 保存模型
        model_path = models_dir / "yolov8n-products.pt"
        model.save(str(model_path))
        print(f"✓ 模型已保存: {model_path}")
        
        # 创建一个示例测试图片
        print("\n[4/4] 创建测试工具...")
        create_test_script(models_dir)
        
        print()
        print("=" * 60)
        print("✓ 快速模型创建完成！")
        print("=" * 60)
        print()
        print("下一步：")
        print("  1. 启动 API 服务:")
        print("     python yolo_api_server.py")
        print()
        print("  2. 在浏览器中测试:")
        print("     http://localhost:8000/docs")
        print()
        print("  3. 将商品图片放入 test_images/ 目录进行测试")
        print()
        
        return True
        
    except Exception as e:
        print(f"✗ 创建失败: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_test_script(models_dir):
    """创建测试脚本"""
    test_script = models_dir.parent / "test_model.py"
    
    script_content = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试 YOLOv8 模型
"""

import cv2
from ultralytics import YOLO
from pathlib import Path

def test_model():
    # 加载模型
    model_path = Path(__file__).parent / "models" / "yolov8n-products.pt"
    model = YOLO(str(model_path))
    
    # 测试图片目录
    test_dir = Path(__file__).parent / "test_images"
    
    if not test_dir.exists():
        print("创建测试图片目录...")
        test_dir.mkdir(exist_ok=True)
        return
    
    # 获取测试图片
    images = list(test_dir.glob("*.jpg")) + list(test_dir.glob("*.png"))
    
    if not images:
        print("测试图片目录为空，请在 test_images/ 目录放入图片")
        return
    
    # 逐个测试
    for img_path in images:
        print(f"\\n测试图片: {img_path.name}")
        
        # 读取图片
        img = cv2.imread(str(img_path))
        
        # 预测
        results = model(img, conf=0.5)
        
        # 显示结果
        result = results[0]
        boxes = result.boxes
        
        print(f"  检测到 {len(boxes)} 个对象:")
        for box in boxes:
            cls = int(box.cls[0])
            conf = float(box.conf[0])
            name = result.names[cls]
            print(f"    - {name}: {conf:.2f}")
        
        # 保存结果
        annotated = result.plot()
        output_path = test_dir / f"result_{img_path.name}"
        cv2.imwrite(str(output_path), annotated)
        print(f"  结果已保存: {output_path}")

if __name__ == "__main__":
    test_model()
'''
    
    with open(test_script, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"✓ 测试脚本已创建: {test_script}")

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
